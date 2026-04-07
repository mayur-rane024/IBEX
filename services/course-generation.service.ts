import axios from "axios";
import { z } from "zod";

import { getGenerationModel, normalizeAiProvider } from "@/lib/ai-provider";
import {
  buildTopicContextFromMatches,
  getCourseSnapshotByCourseId,
  indexCourseRagSource,
  queryCourseRag,
} from "@/lib/course-rag";
import { parseJsonWithSchema } from "@/lib/json-response";
import {
  courseLayoutSchema,
  generatedSlidesSchema,
} from "@/lib/validators/course";
import { saveAudio } from "@/lib/audioStorage";
import {
  getSlideGenerationModel,
  normalizeSlideModel,
} from "@/lib/slide-model";
import {
  Course_config_prompt,
  Generate_Video_Content_Prompt,
} from "@/data/Prompt";
import {
  createCourseForUser,
  getOwnedCourseRecord,
  replaceSlidesForCourse,
} from "@/services/course.service";
import { ServiceError } from "@/lib/service-error";

type CourseLayout = z.infer<typeof courseLayoutSchema>;
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const TTS_MAX_RETRIES = 5;

const sanitizeCourseLayout = (
  value: CourseLayout,
  userInput: string,
  requestedCourseId: string,
) => {
  const normalizedChapters = value.chapters
    .map((chapter, index) => ({
      chapterId: slugify(chapter.chapterId || chapter.chapterTitle) || `chapter-${index + 1}`,
      chapterTitle: chapter.chapterTitle.trim(),
      subContent: chapter.subContent
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 3),
    }))
    .filter((chapter) => chapter.subContent.length > 0)
    .slice(0, 3);

  if (normalizedChapters.length === 0) {
    throw new ServiceError(500, "Model returned no valid chapters");
  }

  return {
    courseId: requestedCourseId || slugify(value.courseId || userInput) || "course-layout",
    courseName: value.courseName.trim() || userInput.trim(),
    courseDescription:
      value.courseDescription.trim() || `A concise course on ${userInput.trim()}.`,
    level: value.level,
    totalChapters: normalizedChapters.length,
    chapters: normalizedChapters,
  };
};

const requestTtsChunk = async (
  chunk: string,
  chunkIndex: number,
): Promise<Buffer> => {
  for (let attempt = 0; attempt <= TTS_MAX_RETRIES; attempt++) {
    try {
      const res = await axios.post(
        "https://api.fonada.ai/tts/generate-audio-large",
        { input: chunk, voice: "Vaanee", Languages: "en-US" },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.FONADALABS_API_KEY}`,
          },
          responseType: "arraybuffer",
          timeout: 120000,
        },
      );
      return Buffer.from(res.data);
    } catch (error) {
      const is429 = axios.isAxiosError(error) && error.response?.status === 429;
      const isServerErr =
        axios.isAxiosError(error) && (error.response?.status ?? 0) >= 500;

      if ((!is429 && !isServerErr) || attempt === TTS_MAX_RETRIES) {
        throw error;
      }

      const delay = 5000 * 2 ** attempt + Math.random() * 1000;
      await sleep(delay);
    }
  }

  throw new ServiceError(500, `TTS failed for chunk ${chunkIndex}`);
};

const splitTextIntoChunks = (text: string, maxLength: number) => {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
};

export const generateCourseLayoutForUser = async (input: {
  userId: string;
  userInput: string;
  courseId: string;
  type: string;
  aiProvider?: string;
  slideModel?: string;
}) => {
  const resolvedAiProvider = normalizeAiProvider(input.aiProvider);
  const resolvedSlideModel = normalizeSlideModel(input.slideModel);
  const model = getGenerationModel({
    provider: resolvedAiProvider,
    temperature: 0.2,
  });

  const response = await model.generateContent(
    `${Course_config_prompt}\n\nCourse Topic is ${input.userInput}`,
  );

  const parsedLayout = parseJsonWithSchema(
    response.response.text(),
    courseLayoutSchema,
  );

  const layout = sanitizeCourseLayout(
    parsedLayout,
    input.userInput,
    input.courseId,
  );

  const persistedLayout = {
    ...layout,
    aiProvider: resolvedAiProvider,
    slideModel: resolvedSlideModel,
  };

  const course = await createCourseForUser({
    userId: input.userId,
    courseId: input.courseId,
    title: layout.courseName,
    prompt: input.userInput,
    type: input.type,
    layout: persistedLayout,
  });

  try {
    await indexCourseRagSource({
      userId: input.userId,
      courseId: input.courseId,
      courseName: layout.courseName,
      courseDescription: layout.courseDescription,
      topicName: layout.courseName,
      userInput: input.userInput,
      chapters: layout.chapters,
    });
  } catch (error) {
    console.warn("Course RAG indexing skipped after course creation", error);
  }

  return course;
};

export const generateCourseSlidesForUser = async (input: {
  userId: string;
  courseId: string;
  chapterId: string;
  chapter: {
    chapterId: string;
    chapterTitle: string;
    subContent: string[];
  };
}) => {
  if (!(await getOwnedCourseRecord(input.userId, input.courseId))) {
    throw new ServiceError(403, "Forbidden");
  }

  let slidePrompt =
    Generate_Video_Content_Prompt +
    "Chapter Detail Is " +
    JSON.stringify(input.chapter);

  const snapshot = await getCourseSnapshotByCourseId(
    input.userId,
    input.courseId,
  );

  if (snapshot) {
    try {
      const ragResult = await queryCourseRag({
        userId: input.userId,
        topicName:
          snapshot.topicName || snapshot.courseName || input.chapter.chapterTitle,
        question: JSON.stringify(input.chapter),
        topK: 6,
      });

      const retrievalContext = buildTopicContextFromMatches(ragResult.matches);
      if (retrievalContext) {
        slidePrompt += `\n\nUse this prior topic context to improve slide quality and continuity:\n${retrievalContext}`;
      }
    } catch (error) {
      console.warn("Slide generation RAG enrichment skipped", error);
    }
  }

  let response;
  const selectedSlideModel = normalizeSlideModel(snapshot?.slideModel);

  try {
    response = await getSlideGenerationModel({
      slideModel: selectedSlideModel,
      temperature: 0.2,
    }).generateContent(slidePrompt);
  } catch (error) {
    console.warn(
      `Selected slide model (${selectedSlideModel}) failed, falling back to local Ollama`,
      error,
    );
    response = await getSlideGenerationModel({
      slideModel: "ollama:mistral:latest",
      temperature: 0.3,
    }).generateContent(slidePrompt);
  }

  const generatedSlides = parseJsonWithSchema(
    response.response.text(),
    generatedSlidesSchema,
  );

  const audioUrls: Record<string, string> = {};

  for (let index = 0; index < generatedSlides.length; index++) {
    const slide = generatedSlides[index];
    const chunks = splitTextIntoChunks(slide.narration.fullText, 430);
    let mergedAudioBuffer = Buffer.alloc(0);

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const audioBuffer = await requestTtsChunk(chunks[chunkIndex], chunkIndex);
      mergedAudioBuffer = Buffer.concat([mergedAudioBuffer, audioBuffer]);
      await sleep(3000);
    }

    audioUrls[index] = await saveAudio(
      mergedAudioBuffer,
      slide.audioFileName.replace(/\.mp3$/i, ""),
    );
    await sleep(5000);
  }

  const savedSlides = await replaceSlidesForCourse({
    userId: input.userId,
    courseId: input.courseId,
    chapterId: input.chapterId,
    slides: generatedSlides.map((slide, index) => ({
      slideIndex: slide.slideIndex,
      slideId: slide.slideId,
      audioFileName: slide.audioFileName,
      audioFileUrl: audioUrls[index] || "",
      narration: slide.narration,
      html: slide.html,
      revealData: slide.revealData,
      content: {
        title: slide.title,
        subtitle: slide.subtitle,
      },
    })),
  });

  try {
    const latestSnapshot = await getCourseSnapshotByCourseId(
      input.userId,
      input.courseId,
    );
    if (latestSnapshot) {
      await indexCourseRagSource({
        userId: input.userId,
        courseId: latestSnapshot.courseId,
        courseName: latestSnapshot.courseName,
        courseDescription: latestSnapshot.courseDescription,
        topicName: latestSnapshot.topicName,
        userInput: latestSnapshot.userInput,
        chapters: latestSnapshot.chapters,
        slides: latestSnapshot.slides,
      });
    }
  } catch (error) {
    console.warn("Course RAG indexing skipped after slide generation", error);
  }

  return {
    slides: savedSlides,
    audioUrls,
  };
};
