"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Bot, Loader2, MessageSquarePlus, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Course } from "@/type/CourseType";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  course: Course;
};

const initialMessage =
  "Ask me anything about this course. I'll answer using the course notes and saved topic context.";

function CourseChatPanel({ course }: Props) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: initialMessage,
    },
  ]);

  const endRef = useRef<HTMLDivElement | null>(null);

  const topicLabel = useMemo(
    () => course.courseLayout?.courseName || course.courseName || "this course",
    [course],
  );

  const loadChatHistory = async (convId: string) => {
    try {
      const response = await axios.get("/api/course-chat", {
        params: { conversationId: convId },
      });

      if (response.data.messages && response.data.messages.length > 0) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  useEffect(() => {
    if (open && conversationId) {
      void loadChatHistory(conversationId);
    }
  }, [conversationId, open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendQuestion = async () => {
    const trimmed = question.trim();

    if (!trimmed || loading) {
      return;
    }

    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);

    try {
      const response = await axios.post("/api/course-chat", {
        courseId: course.courseId,
        question: trimmed,
        conversationId: conversationId || undefined,
      });

      if (!conversationId && response.data.conversationId) {
        setConversationId(response.data.conversationId);
      }

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

  const startNewConversation = () => {
    setConversationId(null);
    setQuestion("");
    setMessages([
      {
        role: "assistant",
        content: initialMessage,
      },
    ]);
  };

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 z-40 gap-2 rounded-full px-5 py-6"
        onClick={() => setOpen(true)}
      >
        <MessageSquarePlus size={18} />
        Ask course bot
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full border-border bg-background p-0 sm:max-w-lg"
        >
          <SheetHeader className="border-b border-border bg-white px-5 py-5 pr-12">
            <SheetTitle className="flex items-center gap-2 text-xl text-slate-950">
              <Bot className="text-indigo-500" size={20} />
              Course chat
            </SheetTitle>
            <SheetDescription className="text-slate-500">
              Ask questions about <span className="text-slate-700">{topicLabel}</span>.
              Answers stay grounded in the course notes.
            </SheetDescription>
            {conversationId ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={startNewConversation}
                className="mt-2 w-fit text-xs"
              >
                New conversation
              </Button>
            ) : null}
          </SheetHeader>

          <div className="flex h-[calc(100vh-84px)] flex-col">
            <ScrollArea className="flex-1 px-4 py-4">
              <div className="space-y-4 pr-2">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        message.role === "user"
                          ? "bg-indigo-600 text-white"
                          : "border border-border bg-white text-slate-700"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words leading-6">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}

                {loading ? (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-slate-600">
                      <Loader2 className="size-4 animate-spin text-indigo-500" />
                      Thinking through the course notes...
                    </div>
                  </div>
                ) : null}

                <div ref={endRef} />
              </div>
            </ScrollArea>

            <div className="border-t border-border bg-white p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {course.courseLayout?.chapters?.slice(0, 3).map((chapter) => (
                  <button
                    key={chapter.chapterId}
                    type="button"
                    className="rounded-full border border-border bg-slate-50 px-3 py-1 text-xs text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    onClick={() =>
                      setQuestion((current) =>
                        current
                          ? current
                          : `Explain ${chapter.chapterTitle} in simple terms.`,
                      )
                    }
                  >
                    <Sparkles size={12} className="mr-1 inline-block" />
                    {chapter.chapterTitle}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <Textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask about concepts, chapters, examples, or next steps..."
                  className="min-h-28 resize-none"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
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
                    className="gap-2"
                  >
                    {loading ? (
                      <Loader2 className="size-4 animate-spin" />
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
