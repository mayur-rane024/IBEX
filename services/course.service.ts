import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/config/db";
import { coursesTable, slidesTable } from "@/config/schema";
import { ServiceError } from "@/lib/service-error";
import { ensureProfile } from "@/services/profile.service";

type PersistedCourseLayout = Record<string, unknown>;

type PersistedSlide = {
  slideIndex: number;
  slideId: string;
  audioFileName: string;
  audioFileUrl: string;
  narration: { fullText: string };
  html: string;
  revealData: string[];
  content?: Record<string, unknown>;
};

const mapCourse = (course: typeof coursesTable.$inferSelect) => ({
  id: course.id,
  courseId: course.id,
  courseName: course.title,
  userInput: course.prompt,
  type: course.type,
  courseLayout: course.layout as PersistedCourseLayout,
  createdAt: course.createdAt,
});

const mapSlide = (slide: typeof slidesTable.$inferSelect) => ({
  id: slide.id,
  courseId: slide.courseId,
  chapterId: slide.chapterId,
  slideId: slide.slideKey,
  slideIndex: slide.slideIndex,
  audioFileName: slide.audioFileName,
  audioFileUrl: slide.videoUrl,
  narration: slide.narration as { fullText: string },
  html: slide.html ?? "",
  revealData: (slide.revealData as string[]) ?? [],
});

export const listCoursesForUser = async (userId: string) => {
  await ensureProfile(userId);

  const courses = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.userId, userId))
    .orderBy(desc(coursesTable.createdAt));

  return courses.map(mapCourse);
};

export const getOwnedCourseRecord = async (userId: string, courseId: string) => {
  const courses = await db
    .select()
    .from(coursesTable)
    .where(and(eq(coursesTable.id, courseId), eq(coursesTable.userId, userId)))
    .limit(1);

  return courses[0] ?? null;
};

export const getCourseForUser = async (userId: string, courseId: string) => {
  const course = await getOwnedCourseRecord(userId, courseId);

  if (!course) {
    throw new ServiceError(403, "Forbidden");
  }

  const slides = await db
    .select()
    .from(slidesTable)
    .where(eq(slidesTable.courseId, courseId))
    .orderBy(asc(slidesTable.slideIndex));

  return {
    ...mapCourse(course),
    chapterContentSlides: slides.map(mapSlide),
  };
};

export const createCourseForUser = async (input: {
  userId: string;
  courseId: string;
  title: string;
  prompt: string;
  type: string;
  layout: PersistedCourseLayout;
}) => {
  await ensureProfile(input.userId);

  const [course] = await db
    .insert(coursesTable)
    .values({
      id: input.courseId,
      title: input.title,
      userId: input.userId,
      prompt: input.prompt,
      type: input.type,
      layout: input.layout,
      createdAt: new Date(),
    })
    .returning();

  return mapCourse(course);
};

export const replaceSlidesForCourse = async (input: {
  userId: string;
  courseId: string;
  chapterId: string;
  slides: PersistedSlide[];
}) => {
  const course = await getOwnedCourseRecord(input.userId, input.courseId);

  if (!course) {
    throw new ServiceError(403, "Forbidden");
  }

  await db
    .delete(slidesTable)
    .where(
      and(
        eq(slidesTable.courseId, input.courseId),
        eq(slidesTable.chapterId, input.chapterId),
      ),
    );

  if (input.slides.length === 0) {
    return [];
  }

  const inserted = await db
    .insert(slidesTable)
    .values(
      input.slides.map((slide) => ({
        courseId: input.courseId,
        chapterId: input.chapterId,
        slideKey: slide.slideId,
        slideIndex: slide.slideIndex,
        audioFileName: slide.audioFileName,
        videoUrl: slide.audioFileUrl,
        narration: slide.narration,
        content: slide.content ?? {},
        html: slide.html,
        revealData: slide.revealData,
        createdAt: new Date(),
      })),
    )
    .returning();

  return inserted.map(mapSlide);
};

export const getOwnedSlideAudio = async (userId: string, slideId: string) => {
  const records = await db
    .select({
      audioFileUrl: slidesTable.videoUrl,
    })
    .from(slidesTable)
    .innerJoin(coursesTable, eq(slidesTable.courseId, coursesTable.id))
    .where(
      and(
        eq(slidesTable.slideKey, slideId),
        eq(coursesTable.userId, userId),
      ),
    )
    .limit(1);

  return records[0] ?? null;
};
