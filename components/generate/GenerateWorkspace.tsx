"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Cpu, Database, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Divider } from "@/components/ui/divider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const typeOptions = [
  {
    value: "full-course",
    label: "Full course",
    description: "Builds a larger multi-chapter course outline.",
  },
  {
    value: "quick-explain-video",
    label: "Quick video",
    description: "Keeps the generation shorter and more focused.",
  },
] as const;

const providerOptions = [
  {
    value: "local-ai",
    label: "Local Ollama",
    description: "Uses your local model for course layout generation.",
  },
  {
    value: "global-ai",
    label: "Global AI",
    description: "Uses configured cloud model keys for course layout generation.",
  },
] as const;

const slideModelOptions = [
  {
    value: "ollama:mistral:latest",
    label: "Ollama | Mistral Latest",
    description: "Local slide generation with Mistral.",
  },
  {
    value: "ollama:llama3.1:8b",
    label: "Ollama | Llama 3.1 8B",
    description: "Local slide generation with Llama 3.1.",
  },
  {
    value: "kimi:kimi-k2.5",
    label: "Kimi | K2.5",
    description: "Cloud slide generation via Kimi.",
  },
  {
    value: "gemini:gemini-2.5-flash",
    label: "Gemini | 2.5 Flash",
    description: "Cloud slide generation via Gemini.",
  },
  {
    value: "openai:gpt-4o-mini",
    label: "OpenAI | GPT-4o Mini",
    description: "Cloud slide generation via OpenAI.",
  },
] as const;

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
  const [courseType, setCourseType] = useState<(typeof typeOptions)[number]["value"]>(
    "full-course",
  );
  const [aiProvider, setAiProvider] = useState<
    (typeof providerOptions)[number]["value"]
  >("local-ai");
  const [slideModel, setSlideModel] = useState<
    (typeof slideModelOptions)[number]["value"]
  >("ollama:mistral:latest");
  const [courses, setCourses] = useState<CoursePreview[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedProvider = providerOptions.find(
    (option) => option.value === aiProvider,
  );
  const selectedSlideModel = slideModelOptions.find(
    (option) => option.value === slideModel,
  );

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
          type: courseType,
          aiProvider,
          slideModel,
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

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Format
                </label>
                <Select
                  value={courseType}
                  onValueChange={(value) =>
                    setCourseType(value as (typeof typeOptions)[number]["value"])
                  }
                >
                  <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Course format</SelectLabel>
                      {typeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-sm leading-6 text-slate-500">
                  {
                    typeOptions.find((option) => option.value === courseType)
                      ?.description
                  }
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Layout backend
                </label>
                <Select
                  value={aiProvider}
                  onValueChange={(value) =>
                    setAiProvider(
                      value as (typeof providerOptions)[number]["value"],
                    )
                  }
                >
                  <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                    <SelectValue placeholder="Select backend" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Layout generation</SelectLabel>
                      {providerOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-sm leading-6 text-slate-500">
                  {selectedProvider?.description}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Slide model
                </label>
                <Select
                  value={slideModel}
                  onValueChange={(value) =>
                    setSlideModel(
                      value as (typeof slideModelOptions)[number]["value"],
                    )
                  }
                >
                  <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Slide generation</SelectLabel>
                      {slideModelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-sm leading-6 text-slate-500">
                  {selectedSlideModel?.description}
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-border bg-slate-50 px-4 py-4 md:grid-cols-3">
              <div className="flex items-start gap-3">
                <Cpu className="mt-0.5 size-4 text-indigo-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-800">
                    Active layout backend
                  </p>
                  <p className="text-sm leading-6 text-slate-500">
                    {selectedProvider?.label}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 size-4 text-cyan-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-800">
                    Active slide model
                  </p>
                  <p className="text-sm leading-6 text-slate-500">
                    {selectedSlideModel?.label}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 size-4 text-indigo-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-800">
                    RAG access
                  </p>
                  <p className="text-sm leading-6 text-slate-500">
                    Use Topic Chat at the bottom-right to query topic memory or
                    upload a PDF into vector storage.
                  </p>
                </div>
              </div>
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
