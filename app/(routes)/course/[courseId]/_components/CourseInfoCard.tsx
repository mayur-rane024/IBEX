"use client";

import { BookOpen, Loader2, Sparkles, Waves } from "lucide-react";
import { Player } from "@remotion/player";

import { CourseComposition } from "./ChapterVideo";
import { Course } from "@/type/CourseType";

type Props = {
  course: Course | undefined;
  durationBySlideId: Record<string, number>;
  isGenerating: boolean;
  isPreparingMedia: boolean;
};

function CourseInfoCard({
  course,
  durationBySlideId,
  isGenerating,
  isPreparingMedia,
}: Props) {
  const fps = 30;
  const slides = course?.chapterContentSlides ?? [];

  const durationInFrames = slides.reduce((sum, slide) => {
    return sum + (durationBySlideId[slide.slideId] ?? fps * 6);
  }, 0);

  const statusLabel = isGenerating
    ? "Generating slides and narration"
    : isPreparingMedia
      ? "Preparing preview"
      : slides.length > 0
        ? "Preview ready"
        : "Course outline ready";

  return (
    <section className="grid gap-8 rounded-3xl border border-border bg-white p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-indigo-600">
            <Sparkles className="size-3.5" />
            Generated course
          </p>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">
              {course?.courseName}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-500">
              {course?.courseLayout?.courseDescription ||
                "A generated course outline is ready for review."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <Waves className="size-4 text-cyan-500" />
            {course?.courseLayout?.level || "Structured"}
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <BookOpen className="size-4 text-indigo-500" />
            {course?.courseLayout?.totalChapters ?? 0} chapters
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-slate-50 px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            {(isGenerating || isPreparingMedia) && (
              <Loader2 className="size-4 animate-spin text-indigo-500" />
            )}
            <span>{statusLabel}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {slides.length > 0
              ? "Review the preview on the right, then move chapter by chapter through the generated lessons below."
              : "The outline is available now. Media assets will appear here as soon as they finish processing."}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-slate-50 p-3">
        <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-white">
          <Player
            component={CourseComposition}
            durationInFrames={Math.max(30, durationInFrames || 30)}
            compositionWidth={1280}
            compositionHeight={720}
            fps={fps}
            controls
            inputProps={{
              slides,
              durationsBySlideId: durationBySlideId,
            }}
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        </div>
      </div>
    </section>
  );
}

export default CourseInfoCard;
