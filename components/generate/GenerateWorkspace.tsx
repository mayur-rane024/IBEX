"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Divider } from "@/components/ui/divider";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type CoursePreview = {
  courseId: string;
  courseName: string;
  type: string;
  createdAt?: string;
  courseLayout?: {
    courseDescription?: string;
    totalChapters?: number;
  };
};

const steps = ["Script", "Slides", "Video"];

const formatDate = (value?: string) => {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

function GenerateWorkspace() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [courses, setCourses] = useState<CoursePreview[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadCourses = async () => {
      setIsLoadingCourses(true);
      setCoursesError(null);

      try {
        const response = await fetch("/api/courses", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load recent courses");
        }

        const payload = (await response.json()) as { courses?: CoursePreview[] };

        if (!cancelled) {
          setCourses(payload.courses ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setCoursesError(
            error instanceof Error
              ? error.message
              : "Unable to load recent courses",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCourses(false);
        }
      }
    };

    void loadCourses();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleGenerate = async () => {
    const userInput = topic.trim();

    if (!userInput || isGenerating) {
      return;
    }

    const courseId = globalThis.crypto?.randomUUID?.() ?? crypto.randomUUID();

    try {
      setGenerationError(null);
      setIsGenerating(true);
      setActiveStep(0);

      const response = await fetch("/api/generate-course-layout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userInput,
          courseId,
          type: "full-course",
          aiProvider: "local-ai",
          slideModel: "ollama:mistral:latest",
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "Failed to generate course");
      }

      setActiveStep(1);
      router.push(`/course/${courseId}`);
    } catch (error) {
      setActiveStep(-1);
      setGenerationError(
        error instanceof Error ? error.message : "Failed to generate course",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="py-12 sm:py-16">
      <Container size="lg" className="space-y-10">
        <section className="space-y-5 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
            Generate
          </p>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-slate-950 sm:text-5xl">
              Turn a topic into a calm, structured course.
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-7 text-slate-500">
              Enter a concept, framework, or problem space. IBEX will generate a
              course outline first, then continue into slide and video creation.
            </p>
          </div>
        </section>

        <Card className="border-border bg-white">
          <CardContent className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
            <div className="space-y-3">
              <label htmlFor="topic" className="text-sm font-medium text-slate-700">
                Topic
              </label>
              <Input
                id="topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Enter topic..."
                className="h-14 text-base"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleGenerate();
                  }
                }}
              />
            </div>

            <div className="flex justify-center sm:justify-start">
              <Button
                onClick={() => void handleGenerate()}
                size="lg"
                disabled={!topic.trim() || isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </div>

            {generationError ? (
              <p className="text-sm text-slate-500">{generationError}</p>
            ) : null}

            <Divider />

            <div className="grid gap-3 sm:grid-cols-3">
              {steps.map((step, index) => {
                const isActive = activeStep === index;
                const isComplete = activeStep > index;

                return (
                  <div
                    key={step}
                    className={`rounded-xl border px-4 py-4 text-left transition-colors ${
                      isActive
                        ? "border-indigo-200 bg-indigo-50"
                        : isComplete
                          ? "border-cyan-200 bg-cyan-50"
                          : "border-border bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                      Step {index + 1}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {step}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-slate-950">
              Output preview
            </h2>
            <p className="text-sm text-slate-500">
              Your recent generated courses live here for quick access.
            </p>
          </div>

          {isLoadingCourses ? (
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-white p-5"
                >
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="mt-3 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : coursesError ? (
            <div className="rounded-xl border border-border bg-white px-5 py-4 text-sm text-slate-500">
              {coursesError}
            </div>
          ) : courses.length > 0 ? (
            <div className="grid gap-4">
              {courses.slice(0, 3).map((course) => (
                <button
                  key={course.courseId}
                  type="button"
                  onClick={() => router.push(`/course/${course.courseId}`)}
                  className="rounded-xl border border-border bg-white px-5 py-5 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/50"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-slate-950">
                        {course.courseName}
                      </h3>
                      <p className="max-w-2xl text-sm leading-6 text-slate-500">
                        {course.courseLayout?.courseDescription ||
                          "Generated course outline ready for preview."}
                      </p>
                    </div>
                    <div className="text-sm text-slate-500">
                      {formatDate(course.createdAt)}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span>{course.type === "full-course" ? "Full course" : "Quick video"}</span>
                    <span>{course.courseLayout?.totalChapters ?? 0} chapters</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-white px-5 py-8 text-sm text-slate-500">
              No generated courses yet. Start with a topic above.
            </div>
          )}
        </section>
      </Container>
    </main>
  );
}

export default GenerateWorkspace;
