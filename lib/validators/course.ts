import { z } from "zod";

export const courseChapterSchema = z.object({
  chapterId: z.string().trim().min(1).max(255),
  chapterTitle: z.string().trim().min(1).max(255),
  subContent: z.array(z.string().trim().min(1).max(255)).min(1).max(3),
});

export const courseLayoutSchema = z.object({
  courseId: z.string().trim().min(1).max(255),
  courseName: z.string().trim().min(1).max(255),
  courseDescription: z.string().trim().min(1).max(2000),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  totalChapters: z.number().int().min(1).max(20),
  chapters: z.array(courseChapterSchema).min(1).max(3),
});

export const createCourseRequestSchema = z.object({
  userInput: z.string().trim().min(1).max(1024),
  courseId: z.string().trim().min(1).max(255),
  type: z.enum(["full-course", "quick-explain-video"]),
  aiProvider: z.enum(["global-ai", "local-ai"]).optional(),
  slideModel: z.string().trim().max(255).optional(),
});

export const generateVideoContentRequestSchema = z.object({
  courseId: z.string().trim().min(1).max(255),
  chapterId: z.string().trim().min(1).max(255),
  chapter: courseChapterSchema,
});

export const generatedSlideSchema = z.object({
  slideIndex: z.number().int().min(1),
  slideId: z.string().trim().min(1).max(255),
  title: z.string().trim().min(1).max(255).optional(),
  subtitle: z.string().trim().min(1).max(500).optional(),
  audioFileName: z.string().trim().min(1).max(255),
  narration: z.object({
    fullText: z.string().trim().min(1).max(2000),
  }),
  html: z.string().trim().min(1),
  revealData: z.array(z.string().trim().min(1).max(255)).default([]),
});

export const generatedSlidesSchema = z.array(generatedSlideSchema).min(1);
