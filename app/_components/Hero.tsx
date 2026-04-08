"use client";

import { useAuth } from "@clerk/nextjs";
import axios, { AxiosError } from "axios";
import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QUICK_VIDEO_SUGGESTIONS } from "@/data/constant";
import { buildAuthUrl } from "@/lib/auth-role";

const Hero = () => {
  const [userInput, setUserInput] = useState("");
  const [type, setType] = useState("full-course");
  const [aiProvider, setAiProvider] = useState("local-ai");
  const [slideModel, setSlideModel] = useState("ollama:mistral:latest");
  const [loading, setLoading] = useState(false);
  const { userId } = useAuth();
  const router = useRouter();

  const generateCourseLayout = async () => {
    if (!userInput.trim()) {
      toast.error("Enter a topic first");
      return;
    }

    const toastId = toast.loading("Generating your course layout...");
    const courseId = globalThis.crypto?.randomUUID?.() ?? uuidv4();

    try {
      setLoading(true);
      await axios.post("/api/generate-course-layout", {
        userInput,
        type,
        aiProvider,
        slideModel,
        courseId,
      });
      toast.success("Course layout generated succesfully!", { id: toastId });
      router.push(`/course/${courseId}`);
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.error || error.message
          : "Something went wrong. Please try again.";

      console.error("Failed to generate course layout:", error);
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center flex-col mt-20">
        <h2 className="text-4xl font-bold">
          Learn Smarter with{" "}
          <span className="text-primary">AI Video Courses</span>
        </h2>
        <p className="text-center text-gray-500 mt-3 text-xl">
          Turn Any Topic into a Complete Course
        </p>

        <div className="grid w-full max-w-xl bg-white z-10 mt-5 gap-6">
          <InputGroup>
            <InputGroupTextarea
              data-slot="input-group-control"
              className="flex field-sizing-content min-h-24 w-full resize-none rounded-xl bg-white px-3 py-2.5 text-base transition-[color,box-shadow] outline-none md:text-sm"
              placeholder="Autoresize textarea..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
            <InputGroupAddon align="block-end">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Full Course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="full-course">Full Course</SelectItem>
                    <SelectItem value="quick-explain-video">
                      Quick Explain Video
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={aiProvider} onValueChange={setAiProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Global AI" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>AI Backend</SelectLabel>
                    <SelectItem value="global-ai">Global AI</SelectItem>
                    <SelectItem value="local-ai">Local AI (Ollama)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={slideModel} onValueChange={setSlideModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Slide Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Slide Model</SelectLabel>
                    <SelectItem value="ollama:mistral:latest">
                      Ollama · Mistral Latest
                    </SelectItem>
                    <SelectItem value="ollama:llama3.1:8b">
                      Ollama · Llama 3.1 8B
                    </SelectItem>
                    <SelectItem value="kimi:kimi-k2.5">Kimi · K2.5</SelectItem>
                    <SelectItem value="gemini:gemini-2.5-flash">
                      Gemini · 2.5 Flash
                    </SelectItem>
                    <SelectItem value="openai:gpt-4o-mini">
                      OpenAI · GPT-4o Mini
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <InputGroupButton
                className="ml-auto"
                size="icon-sm"
                variant="default"
                onClick={
                  userId
                    ? generateCourseLayout
                    : () => router.push(buildAuthUrl("/sign-in", "user"))
                }
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Send />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className="flex gap-5 mt-5 max-w-3xl flex-wrap justify-center z-10">
          {QUICK_VIDEO_SUGGESTIONS.map((suggestion, index) => (
            <h2
              className="border rounded-2xl px-2 p-1 cursor-pointer text-sm bg-white"
              key={index}
              onClick={() => setUserInput(suggestion.prompt)}
            >
              {suggestion.title}
            </h2>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;
