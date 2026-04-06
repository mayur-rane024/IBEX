"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Bot, Loader2, MessageSquarePlus, Send, Sparkles } from "lucide-react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Course } from "@/type/CourseType";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  course: Course;
};

function CourseChatPanel({ course }: Props) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Ask me anything about this course. I’ll answer using the course notes and previous saved topic records.",
    },
  ]);

  const endRef = useRef<HTMLDivElement | null>(null);

  const topicLabel = useMemo(
    () => course?.courseLayout?.courseName || course?.courseName || "this course",
    [course],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendQuestion = async () => {
    const trimmed = question.trim();

    if (!trimmed || loading) return;

    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);

    try {
      const response = await axios.post("/api/course-chat", {
        courseId: course.courseId,
        question: trimmed,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.data.answer || "I could not generate an answer.",
        },
      ]);
    } catch (error) {
      console.error("Course chat request failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I could not answer that right now. Please try again after the course content finishes indexing.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 z-40 rounded-full shadow-2xl px-4 py-6 gap-2 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400"
        onClick={() => setOpen(true)}
      >
        <MessageSquarePlus size={18} />
        Ask Course Bot
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg border-slate-800 bg-slate-950 text-slate-50 p-0"
        >
          <SheetHeader className="border-b border-white/10 p-5 pr-12 bg-slate-950/95 backdrop-blur">
            <SheetTitle className="flex items-center gap-2 text-xl text-white">
              <Bot className="text-emerald-400" size={20} />
              Course Chat
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              Ask questions about <span className="text-slate-200">{topicLabel}</span>.
              Powered by local Ollama plus Pinecone topic memory.
            </SheetDescription>
          </SheetHeader>

          <div className="flex h-[calc(100vh-84px)] flex-col">
            <ScrollArea className="flex-1 px-4 py-4">
              <div className="space-y-4 pr-2">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        message.role === "user"
                          ? "bg-emerald-500 text-white"
                          : "bg-white/5 text-slate-100 border border-white/10"
                      }`}
                    >
                      <p className="whitespace-pre-wrap wrap-break-word leading-6">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                      <Loader2 className="animate-spin" size={16} />
                      Thinking with the course notes...
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            </ScrollArea>

            <div className="border-t border-white/10 bg-slate-950 p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {course?.courseLayout?.chapters?.slice(0, 3).map((chapter) => (
                  <button
                    key={chapter.chapterId}
                    type="button"
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:bg-white/10"
                    onClick={() =>
                      setQuestion((current) =>
                        current
                          ? current
                          : `Explain ${chapter.chapterTitle} in simple terms.`
                      )
                    }
                  >
                    <Sparkles size={12} className="inline-block mr-1" />
                    {chapter.chapterTitle}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask about concepts, chapters, examples, or next steps..."
                  className="min-h-28 resize-none border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500/40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendQuestion();
                    }
                  }}
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Press Enter to send, Shift+Enter for a new line.
                  </p>
                  <Button
                    onClick={() => void sendQuestion()}
                    disabled={loading || !question.trim()}
                    className="gap-2 bg-emerald-500 text-white hover:bg-emerald-400"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Send size={16} />
                    )}
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default CourseChatPanel;
