import axios from "axios";
import { eq } from "drizzle-orm";

import { db } from "@/config/db";
import { chapterContentSlides, coursesTable } from "@/config/schema";
import {
  getLocalCourse,
  isDatabaseConnectionError,
} from "@/lib/dbFallback";

type CourseChapter = {
  chapterId: string;
  chapterTitle: string;
  subContent: string[];
};

type CourseSlide = {
  slideId: string;
  slideIndex: number;
  chapterId: string;
  title?: string;
  subtitle?: string;
  narration?: { fullText?: string };
  html?: string;
};

type CourseSnapshot = {
  courseId: string;
  courseName: string;
  courseDescription: string;
  topicName: string;
  userInput: string;
  chapters: CourseChapter[];
  slides: CourseSlide[];
};

type CourseRagSource = {
  courseId: string;
  courseName: string;
  courseDescription?: string;
  topicName?: string;
  userInput?: string;
  chapters?: CourseChapter[];
  slides?: CourseSlide[];
};

type PineconeVector = {
  id: string;
  values: number[];
  metadata: Record<string, string | number | boolean>;
};

type PineconeMatch = {
  id?: string;
  score?: number;
  metadata?: Record<string, unknown>;
};

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
const PINECONE_INDEX_HOST = process.env.PINECONE_INDEX_HOST || "";
const PINECONE_NAMESPACE_PREFIX =
  process.env.PINECONE_NAMESPACE_PREFIX || "course";
const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

const hasPineconeConfig = () => Boolean(PINECONE_API_KEY && PINECONE_INDEX_HOST);

const indexBaseUrl = () => {
  if (!PINECONE_INDEX_HOST) {
    return "";
  }

  const trimmed = PINECONE_INDEX_HOST.trim().replace(/\/+$/, "");
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const topicNamespace = (value: string) => slugify(value) || "course";

export const courseTopicNamespace = (value: string) => {
  const topic = topicNamespace(value);
  const prefix = slugify(PINECONE_NAMESPACE_PREFIX) || "course";
  return `${prefix}-${topic}`;
};

const stripHtml = (value: string) =>
  value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const safeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const chunkText = (text: string, maxLength = 1000) => {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return [] as string[];
  }

  const chunks: string[] = [];

  for (let cursor = 0; cursor < normalized.length; cursor += maxLength) {
    chunks.push(normalized.slice(cursor, cursor + maxLength));
  }

  return chunks;
};

const embedText = async (text: string) => {
  const response = await axios.post(
    `${OLLAMA_BASE_URL.replace(/\/$/, "")}/api/embeddings`,
    {
      model: OLLAMA_EMBED_MODEL,
      prompt: text,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 180000,
      proxy: false,
      validateStatus: () => true,
    },
  );

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      `Ollama embeddings request failed with status ${response.status} (${response.statusText})`,
    );
  }

  const embedding = response.data?.embedding;

  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Ollama embeddings returned no vector");
  }

  return embedding as number[];
};

const pineconeRequest = async <T>(
  path: string,
  body: Record<string, unknown>,
) => {
  const baseUrl = indexBaseUrl();

  if (!baseUrl) {
    throw new Error("Pinecone index host is not configured");
  }

  const response = await axios.post<T>(`${baseUrl}${path}`, body, {
    headers: {
      "Api-Key": PINECONE_API_KEY,
      "Content-Type": "application/json",
    },
    timeout: 180000,
    proxy: false,
    validateStatus: () => true,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      `Pinecone request failed with status ${response.status} (${response.statusText})`,
    );
  }

  return response.data;
};

const buildOverviewText = (input: CourseRagSource) => {
  const lines = [
    `Course: ${input.courseName}`,
    input.courseDescription ? `Description: ${input.courseDescription}` : "",
    input.userInput ? `Topic input: ${input.userInput}` : "",
  ].filter(Boolean);

  return lines.join("\n");
};

const buildChapterText = (chapter: CourseChapter, index: number) => {
  const bullets = chapter.subContent.map((item) => `- ${item}`).join("\n");
  return [
    `Chapter ${index + 1}: ${chapter.chapterTitle}`,
    bullets,
  ]
    .filter(Boolean)
    .join("\n");
};

const buildSlideText = (slide: CourseSlide) => {
  const parts = [
    slide.title ? `Slide title: ${slide.title}` : "",
    slide.subtitle ? `Slide subtitle: ${slide.subtitle}` : "",
    slide.narration?.fullText
      ? `Narration: ${slide.narration.fullText}`
      : "",
    slide.html ? `Visual notes: ${stripHtml(slide.html)}` : "",
  ].filter(Boolean);

  return parts.join("\n");
};

const buildVectorMetadata = (
  input: CourseRagSource,
  kind: string,
  extra: Record<string, string | number | boolean>,
) => ({
  courseId: input.courseId,
  courseName: input.courseName,
  topicName:
    input.topicName || input.courseName || input.userInput || input.courseId,
  kind,
  ...extra,
});

export const getCourseSnapshotByCourseId = async (
  courseId: string,
): Promise<CourseSnapshot | null> => {
  try {
    const courses = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.courseId, courseId));

    const course = courses[0];

    if (!course) {
      return null;
    }

    const slides = await db
      .select()
      .from(chapterContentSlides)
      .where(eq(chapterContentSlides.courseId, courseId));

    const courseLayout = (course.courseLayout as
      | {
          courseName?: string;
          courseDescription?: string;
          chapters?: CourseChapter[];
        }
      | null)
      ?? {};

    return {
      courseId,
      courseName: courseLayout.courseName || course.courseName,
      courseDescription:
        courseLayout.courseDescription || `A concise course on ${course.courseName}.`,
      topicName: courseLayout.courseName || course.courseName || course.userInput,
      userInput: course.userInput,
      chapters: Array.isArray(courseLayout.chapters) ? courseLayout.chapters : [],
      slides: slides as CourseSlide[],
    };
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    const localCourse = await getLocalCourse(courseId);

    if (!localCourse) {
      return null;
    }

    const courseLayout = (localCourse.courseLayout as
      | {
          courseName?: string;
          courseDescription?: string;
          chapters?: CourseChapter[];
        }
      | null)
      ?? {};

    return {
      courseId,
      courseName: courseLayout.courseName || localCourse.courseName,
      courseDescription:
        courseLayout.courseDescription || `A concise course on ${localCourse.courseName}.`,
      topicName:
        courseLayout.courseName || localCourse.courseName || localCourse.userInput,
      userInput: localCourse.userInput,
      chapters: Array.isArray(courseLayout.chapters) ? courseLayout.chapters : [],
      slides: (localCourse.chapterContentSlides as CourseSlide[]) || [],
    };
  }
};

export const indexCourseRagSource = async (input: CourseRagSource) => {
  if (!hasPineconeConfig()) {
    return {
      indexed: false,
      reason: "Pinecone is not configured",
    };
  }

  const namespace = courseTopicNamespace(
    input.topicName || input.courseName || input.userInput || input.courseId,
  );

  const documents: Array<{
    id: string;
    text: string;
    metadata: Record<string, string | number | boolean>;
  }> = [];

  const overviewText = buildOverviewText(input);
  if (overviewText) {
    documents.push({
      id: `${input.courseId}:overview`,
      text: overviewText,
      metadata: buildVectorMetadata(input, "overview", {
        itemIndex: 0,
      }),
    });
  }

  (input.chapters ?? []).forEach((chapter, index) => {
    const text = buildChapterText(chapter, index);
    if (!text) return;

    documents.push({
      id: `${input.courseId}:chapter:${chapter.chapterId || index}`,
      text,
      metadata: buildVectorMetadata(input, "chapter", {
        itemIndex: index + 1,
        chapterId: chapter.chapterId,
        chapterTitle: chapter.chapterTitle,
      }),
    });
  });

  (input.slides ?? []).forEach((slide, index) => {
    const text = buildSlideText(slide);
    if (!text) return;

    documents.push({
      id: `${input.courseId}:slide:${slide.slideId || index}`,
      text,
      metadata: buildVectorMetadata(input, "slide", {
        itemIndex: index + 1,
        slideId: slide.slideId,
        slideIndex: slide.slideIndex,
        chapterId: slide.chapterId,
      }),
    });
  });

  if (documents.length === 0) {
    return { indexed: false, reason: "No course documents to index" };
  }

  for (let index = 0; index < documents.length; index += 20) {
    const batch = documents.slice(index, index + 20);
    const vectors: PineconeVector[] = [];

    for (const document of batch) {
      const values = await embedText(document.text);
      vectors.push({
        id: document.id,
        values,
        metadata: {
          ...document.metadata,
          text: document.text,
        },
      });
    }

    await pineconeRequest("/vectors/upsert", {
      namespace,
      vectors,
    });
  }

  return {
    indexed: true,
    namespace,
    documentCount: documents.length,
  };
};

export const queryCourseRag = async ({
  topicName,
  question,
  topK = 6,
}: {
  topicName: string;
  question: string;
  topK?: number;
}) => {
  if (!hasPineconeConfig()) {
    return {
      matches: [] as PineconeMatch[],
      namespace: courseTopicNamespace(topicName),
      pineconeAvailable: false,
    };
  }

  const namespace = courseTopicNamespace(topicName);
  const vector = await embedText(question);
  const response = await pineconeRequest<{
    matches?: PineconeMatch[];
  }>("/query", {
    namespace,
    vector,
    topK,
    includeMetadata: true,
  });

  return {
    matches: response.matches || [],
    namespace,
    pineconeAvailable: true,
  };
};

export const indexTopicRecords = async ({
  topicName,
  sourceId,
  records,
  metadata,
}: {
  topicName: string;
  sourceId: string;
  records: string[];
  metadata?: Record<string, string | number | boolean>;
}) => {
  if (!hasPineconeConfig()) {
    return {
      indexed: false,
      reason: "Pinecone is not configured",
    };
  }

  const namespace = courseTopicNamespace(topicName);

  const flattened = records.flatMap((record) => chunkText(record));

  if (flattened.length === 0) {
    return {
      indexed: false,
      reason: "No text records to index",
    };
  }

  const vectors: PineconeVector[] = [];

  for (let index = 0; index < flattened.length; index++) {
    const text = flattened[index];
    const values = await embedText(text);
    vectors.push({
      id: `${sourceId}:${index}`,
      values,
      metadata: {
        ...(metadata || {}),
        topicName,
        sourceId,
        kind: "external-record",
        chunkIndex: index,
        text,
      },
    });
  }

  await pineconeRequest("/vectors/upsert", {
    namespace,
    vectors,
  });

  return {
    indexed: true,
    namespace,
    documentCount: vectors.length,
  };
};

export const queryTopicRecords = async ({
  topicName,
  question,
  topK = 8,
}: {
  topicName: string;
  question: string;
  topK?: number;
}) => {
  if (!hasPineconeConfig()) {
    return {
      matches: [] as PineconeMatch[],
      namespace: courseTopicNamespace(topicName),
      pineconeAvailable: false,
    };
  }

  const namespace = courseTopicNamespace(topicName);
  const vector = await embedText(question);

  const response = await pineconeRequest<{
    matches?: PineconeMatch[];
  }>("/query", {
    namespace,
    vector,
    topK,
    includeMetadata: true,
  });

  return {
    matches: response.matches || [],
    namespace,
    pineconeAvailable: true,
  };
};

export const buildTopicContextFromMatches = (matches: PineconeMatch[]) =>
  matches
    .map((match, index) => {
      const metadata = match.metadata || {};
      const text = safeString(metadata.text);

      if (!text) {
        return "";
      }

      return [
        `Reference ${index + 1}`,
        safeString(metadata.kind) ? `Kind: ${safeString(metadata.kind)}` : "",
        safeString(metadata.courseName)
          ? `Course: ${safeString(metadata.courseName)}`
          : "",
        text,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean)
    .join("\n\n");

export const buildCourseContextBlock = (
  snapshot: CourseSnapshot,
  matches: PineconeMatch[],
) => {
  const chaptersText = snapshot.chapters
    .map((chapter, index) => buildChapterText(chapter, index))
    .join("\n\n");

  const slidesText = snapshot.slides
    .map((slide) => buildSlideText(slide))
    .filter(Boolean)
    .join("\n\n");

  const pineconeText = matches
    .map((match, index) => {
      const metadata = match.metadata || {};
      const text = safeString(metadata.text) || "";

      return [
        `Match ${index + 1}`,
        safeString(metadata.kind) ? `Kind: ${safeString(metadata.kind)}` : "",
        safeString(metadata.chapterTitle)
          ? `Chapter: ${safeString(metadata.chapterTitle)}`
          : "",
        safeString(metadata.slideId) ? `Slide: ${safeString(metadata.slideId)}` : "",
        text ? `Text: ${text}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean)
    .join("\n\n");

  return [
    `Course: ${snapshot.courseName}`,
    `Topic: ${snapshot.topicName}`,
    snapshot.courseDescription ? `Description: ${snapshot.courseDescription}` : "",
    chaptersText ? `Chapters:\n${chaptersText}` : "",
    slidesText ? `Slides:\n${slidesText}` : "",
    pineconeText ? `Retrieved references:\n${pineconeText}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
};
