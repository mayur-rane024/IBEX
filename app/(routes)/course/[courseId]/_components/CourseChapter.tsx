import { Dot, PlayCircle } from "lucide-react";
import { Player } from "@remotion/player";

import { CourseComposition } from "./ChapterVideo";
import { Course } from "@/type/CourseType";

type Props = {
  course: Course | undefined;
  durationBySlideId: Record<string, number>;
  isPreparingMedia: boolean;
};

function CourseChapter({
  course,
  durationBySlideId,
  isPreparingMedia,
}: Props) {
  const slides = course?.chapterContentSlides ?? [];
  const chapters = course?.courseLayout?.chapters ?? [];

  const getChapterDurationInFrames = (chapterId: string) =>
    Math.max(
      30,
      slides
        .filter((slide) => slide.chapterId === chapterId)
        .reduce((sum, slide) => sum + (durationBySlideId[slide.slideId] ?? 180), 0),
    );

  if (chapters.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-white px-6 py-8 text-sm text-slate-500">
        No chapters are available for this course yet.
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-slate-950">Course outline</h2>
        <p className="text-sm text-slate-500">
          Each chapter includes the generated talking points and a short preview.
        </p>
      </div>

      <div className="space-y-4">
        {chapters.map((chapter, index) => {
          const chapterSlides = slides.filter(
            (slide) => slide.chapterId === chapter.chapterId,
          );

          return (
            <section
              key={chapter.chapterId || index}
              className="rounded-2xl border border-border bg-white p-5 sm:p-6"
            >
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-sm font-semibold text-indigo-600">
                      {index + 1}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-slate-950">
                        {chapter.chapterTitle}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {chapter.subContent.length} talking point
                        {chapter.subContent.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {chapter.subContent.map((content, contentIndex) => (
                      <div
                        key={`${chapter.chapterId}-${contentIndex}`}
                        className="flex items-start gap-2 text-sm leading-6 text-slate-600"
                      >
                        <Dot className="mt-1 size-5 shrink-0 text-cyan-500" />
                        <span>{content}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-slate-50 p-3">
                  {chapterSlides.length > 0 ? (
                    <Player
                      className="overflow-hidden rounded-xl border border-border bg-white"
                      component={CourseComposition}
                      durationInFrames={getChapterDurationInFrames(chapter.chapterId)}
                      compositionWidth={1280}
                      compositionHeight={720}
                      fps={30}
                      controls
                      inputProps={{
                        slides: chapterSlides,
                        durationsBySlideId: durationBySlideId,
                      }}
                      style={{
                        width: "100%",
                        aspectRatio: "16/9",
                      }}
                    />
                  ) : (
                    <div className="flex aspect-video flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white px-5 text-center">
                      <PlayCircle className="size-8 text-indigo-500" />
                      <p className="mt-3 text-sm font-medium text-slate-700">
                        Preview not ready yet
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {isPreparingMedia
                          ? "Media is still being prepared for this chapter."
                          : "This chapter preview will appear after generation completes."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

export default CourseChapter;
