"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import CourseChapter from "./_components/CourseChapter";
import CourseChatPanel from "./_components/CourseChatPanel";
import CourseInfoCard from "./_components/CourseInfoCard";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { Course } from "@/type/CourseType";

function CoursePreview() {
  const { courseId } = useParams();

  const [courseDetail, setCourseDetail] = useState<Course | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [durationBySlideId, setDurationBySlideId] = useState<
    Record<string, number>
  >({});
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [isPreparingMedia, setIsPreparingMedia] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const hasFetched = useRef(false);
  const fps = 30;

  const fetchCourseDetail = useCallback(async () => {
    if (!courseId) {
      setPageError("Course not found.");
      return null;
    }

    try {
      setPageError(null);
      const result = await axios.get(`/api/course?courseId=${courseId}`);
      setCourseDetail(result.data);
      return result.data as Course;
    } catch (error) {
      console.error("Error fetching course:", error);
      const message =
        error instanceof Error ? error.message : "Failed to load course details";
      setPageError(message);
      toast.error("Failed to load course details");
      return null;
    }
  }, [courseId]);

  const generateVideoContent = useCallback(
    async (course: Course) => {
      if (isGenerating) {
        return;
      }

      const chapters = Array.isArray(course.courseLayout?.chapters)
        ? course.courseLayout.chapters
        : [];

      if (chapters.length === 0) {
        setIsPreparingMedia(false);
        return;
      }

      setIsGenerating(true);
      const toastId = toast.loading(
        `Preparing ${chapters.length} chapter${chapters.length === 1 ? "" : "s"}...`,
      );

      try {
        await Promise.all(
          chapters.map((chapter, index) =>
            axios.post("/api/generate-video-content", {
              chapter,
              chapterId: chapter.chapterId || String(index),
              courseId,
            }),
          ),
        );

        toast.success("Course media is ready.", { id: toastId });
        await fetchCourseDetail();
      } catch (error) {
        console.error("Generation error:", error);
        toast.error("Failed to prepare course media.", { id: toastId });
      } finally {
        setIsGenerating(false);
      }
    },
    [courseId, fetchCourseDetail, isGenerating],
  );

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setIsLoadingCourse(true);

      const data = await fetchCourseDetail();

      if (!mounted) {
        return;
      }

      setIsLoadingCourse(false);

      if (
        data &&
        !hasFetched.current &&
        (data.chapterContentSlides?.length ?? 0) === 0
      ) {
        hasFetched.current = true;
        setIsPreparingMedia(true);
        void generateVideoContent(data);
      }
    };

    void init();

    return () => {
      mounted = false;
    };
  }, [fetchCourseDetail, generateVideoContent]);

  useEffect(() => {
    let cancelled = false;

    const calculateAudioDurations = async () => {
      const slides = courseDetail?.chapterContentSlides ?? [];

      if (!courseDetail) {
        return;
      }

      if (slides.length === 0) {
        setDurationBySlideId({});
        setIsPreparingMedia(isGenerating);
        return;
      }

      setIsPreparingMedia(true);

      const durationMap: Record<string, number> = {};

      const results = await Promise.all(
        slides.map(async (slide) => {
          try {
            const audio = new Audio();

            return await new Promise<[string, number]>((resolve) => {
              const cleanup = () => {
                audio.src = "";
              };

              const resolveWithFrames = (frames: number) => {
                cleanup();
                resolve([slide.slideId, frames]);
              };

              const timeout = window.setTimeout(() => {
                resolveWithFrames(Math.ceil(6 * fps));
              }, 5000);

              audio.addEventListener(
                "loadedmetadata",
                () => {
                  window.clearTimeout(timeout);
                  resolveWithFrames(Math.max(30, Math.ceil(audio.duration * fps)));
                },
                { once: true },
              );

              audio.addEventListener(
                "error",
                () => {
                  window.clearTimeout(timeout);
                  resolveWithFrames(Math.ceil(6 * fps));
                },
                { once: true },
              );

              audio.src = slide.audioFileUrl;
              audio.load();
            });
          } catch (error) {
            console.error(
              `Error calculating duration for ${slide.slideId}:`,
              error,
            );
            return [slide.slideId, Math.ceil(6 * fps)] as [string, number];
          }
        }),
      );

      if (!cancelled) {
        results.forEach(([slideId, frames]) => {
          durationMap[slideId] = frames;
        });
        setDurationBySlideId(durationMap);
        setIsPreparingMedia(false);
      }
    };

    void calculateAudioDurations();

    return () => {
      cancelled = true;
    };
  }, [courseDetail, fps, isGenerating]);

  if (isLoadingCourse) {
    return (
      <main className="py-12 sm:py-16">
        <Container size="xl" className="space-y-8">
          <div className="grid gap-6 rounded-3xl border border-border bg-white p-6 sm:grid-cols-[1.1fr_0.9fr] sm:p-8">
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
              <div className="flex gap-3">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
            <Skeleton className="aspect-video w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </Container>
      </main>
    );
  }

  if (!courseDetail) {
    return (
      <main className="py-12 sm:py-16">
        <Container size="lg">
          <div className="rounded-2xl border border-border bg-white px-6 py-8 text-sm text-slate-500">
            {pageError || "This course is unavailable right now."}
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="py-12 sm:py-16">
      <Container size="xl" className="space-y-8">
        <CourseInfoCard
          course={courseDetail}
          durationBySlideId={durationBySlideId}
          isGenerating={isGenerating}
          isPreparingMedia={isPreparingMedia}
        />
        <CourseChapter
          course={courseDetail}
          durationBySlideId={durationBySlideId}
          isPreparingMedia={isPreparingMedia}
        />
      </Container>
      <CourseChatPanel course={courseDetail} />
    </main>
  );
}

export default CoursePreview;
