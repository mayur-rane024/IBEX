import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { db } from "@/config/db";
import { chapterContentSlides } from "@/config/schema";
import { getGenerationModel } from "@/lib/ai-provider";
import { isDatabaseConnectionError, saveLocalSlides } from "@/lib/dbFallback";
import {
  buildTopicContextFromMatches,
  getCourseSnapshotByCourseId,
  indexCourseRagSource,
  queryCourseRag,
} from "@/lib/course-rag";
import { getKimiSlideModel, hasKimiApiKey } from "@/lib/kimi";
import { Generate_Video_Content_Prompt } from "@/data/Prompt";
import { saveAudio } from "@/lib/audioStorage";

type GeneratedSlide = {
  slideIndex: number;
  slideId: string;
  audioFileName: string;
  narration: { fullText: string };
  html?: string;
  revealData?: unknown;
};

// ================= HELPER FUNCTIONS =================

// Prevent 429 errors
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const TTS_MAX_RETRIES = 5;

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
        console.error(`TTS error for chunk ${chunkIndex}:`, error);
        throw error;
      }

      const delay = 5000 * 2 ** attempt + Math.random() * 1000;
      console.warn(
        `TTS chunk ${chunkIndex} got ${error.response?.status}. Retry ${attempt + 1}/${TTS_MAX_RETRIES} in ${Math.round(delay)}ms`,
      );
      await sleep(delay);
    }
  }
  throw new Error(
    `TTS failed for chunk ${chunkIndex} after ${TTS_MAX_RETRIES} retries`,
  );
};

// Split text under 450 chars
const splitTextIntoChunks = (text: string, maxLength: number) => {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
};

// ================= MAIN API =================

export async function POST(req: NextRequest) {
  const { chapter, chapterId, courseId } = await req.json();

  if (!courseId) {
    return NextResponse.json(
      { error: "courseId is required" },
      { status: 400 },
    );
  }

  let slidePrompt =
    Generate_Video_Content_Prompt +
    "Chapter Detail Is " +
    JSON.stringify(chapter);

  try {
    const snapshot = await getCourseSnapshotByCourseId(courseId);
    const topicName =
      snapshot?.topicName || snapshot?.courseName || chapter?.chapterTitle || "course";

    const ragResult = await queryCourseRag({
      topicName,
      question: JSON.stringify(chapter),
      topK: 6,
    });

    const retrievalContext = buildTopicContextFromMatches(ragResult.matches);

    if (retrievalContext) {
      slidePrompt += `\n\nUse this prior topic context to improve slide quality and continuity:\n${retrievalContext}`;
    }
  } catch (ragError) {
    console.warn("Slide generation RAG enrichment skipped:", ragError);
  }

  let response;

  try {
    const kimiModel = getKimiSlideModel({ temperature: 0.2 });
    response = await kimiModel.generateContent(slidePrompt);
  } catch (error) {
    console.warn(
      hasKimiApiKey()
        ? "Kimi slide generation failed, falling back to local Ollama"
        : "No Moonshot API key found, falling back to local Ollama",
      error,
    );

    const localModel = getGenerationModel({
      provider: "local-ai",
      temperature: 0.3,
    });

    response = await localModel.generateContent(slidePrompt);
  }

  const AiResponse = response.response.text();

  const VideoContentJson = JSON.parse(
    AiResponse?.replace("json", "").replace("", "") || "[]",
  ) as GeneratedSlide[];

  // const VideoContentJson = Video_SlidesDummy;
  const audioFileUrls: Record<string, string> = {};

  // ================= GENERATE TTS FOR ALL SLIDES =================
  for (let i = 0; i < VideoContentJson.length; i++) {
    const slide = VideoContentJson[i];
    const narration = slide.narration.fullText;

    console.log(
      `Generating audio for slide ${i + 1}/${VideoContentJson.length}: ${slide.slideId}`,
    );

    // 1️⃣ Split narration into chunks (under 450 chars each for TTS)
    const chunks = splitTextIntoChunks(narration, 430);
    let mergedAudioBuffer = Buffer.alloc(0);

    // 2️⃣ Generate TTS for each chunk with retry logic
    for (let j = 0; j < chunks.length; j++) {
      const audioBuffer = await requestTtsChunk(chunks[j], j);
      mergedAudioBuffer = Buffer.concat([mergedAudioBuffer, audioBuffer]);
      await sleep(3000);
    }

    // 3️⃣ Upload merged audio to storage (local or S3)
    const audioUrl = await saveAudio(mergedAudioBuffer, slide.audioFileName);
    audioFileUrls[i] = audioUrl;

    // Wait between slides to avoid rate limits
    await sleep(5000);
  }

  // ================= SAVE ALL SLIDES TO DATABASE =================
  try {
    for (let index = 0; index < VideoContentJson.length; index++) {
      const slide = VideoContentJson[index];

      await db
        .insert(chapterContentSlides)
        .values({
          chapterId: chapterId,
          courseId: courseId,
          slideIndex: slide.slideIndex,
          slideId: slide.slideId,
          audioFileName: slide.audioFileName,
          audioFileUrl: audioFileUrls[index] || "",
          narration: slide.narration || {},
          html: slide.html || "",
          revealData: slide.revealData || [],
        })
        .returning();

      console.log(`✓ Slide saved to DB: ${slide.slideId}`);
    }

    try {
      const courseSnapshot = await getCourseSnapshotByCourseId(courseId);

      if (courseSnapshot) {
        await indexCourseRagSource({
          courseId: courseSnapshot.courseId,
          courseName: courseSnapshot.courseName,
          courseDescription: courseSnapshot.courseDescription,
          topicName: courseSnapshot.topicName,
          userInput: courseSnapshot.userInput,
          chapters: courseSnapshot.chapters,
          slides: [...courseSnapshot.slides, ...VideoContentJson],
        });
      }
    } catch (indexError) {
      console.warn(
        "Course RAG indexing skipped after slide generation:",
        indexError,
      );
    }
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    console.warn(
      "Database unavailable in /api/generate-video-content, saving locally",
    );

    await saveLocalSlides(
      courseId,
      chapterId,
      VideoContentJson.map((slide, index) => ({
        slideIndex: slide.slideIndex,
        slideId: slide.slideId,
        audioFileName: slide.audioFileName,
        audioFileUrl: audioFileUrls[index] || "",
        narration: slide.narration || {},
        html: slide.html || "",
        revealData: slide.revealData || [],
      })),
    );
  }

  return NextResponse.json({
    slides: VideoContentJson,
    audioUrls: audioFileUrls,
    message: "Video content generated successfully",
  });
}
