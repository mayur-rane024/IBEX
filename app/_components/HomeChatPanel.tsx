"use client";

import React, { useRef, useState } from "react";
import axios from "axios";
import { Bot, Loader2, MessageCircleQuestion, Send, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

type Message = {
  role: "assistant" | "user";
  content: string;
};

function HomeChatPanel() {
  const [open, setOpen] = useState(false);
  const [topicName, setTopicName] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! Ask about any topic from previous records. If no records exist, upload a PDF and I’ll index it.",
    },
  ]);
  const [needUpload, setNeedUpload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const askQuestion = async () => {
    const topic = topicName.trim();
    const prompt = question.trim();

    if (!topic || !prompt || loading) {
      return;
    }

    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setLoading(true);

    try {
      const response = await axios.post("/api/home-chat", {
        topicName: topic,
        question: prompt,
      });

      setNeedUpload(Boolean(response.data.needUpload));
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.answer || "No answer." },
      ]);
    } catch (error) {
      console.error("Home chat failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I could not process that question right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const uploadPdf = async () => {
    const file = fileRef.current?.files?.[0];
    const topic = topicName.trim();

    if (!topic || !file || uploading) {
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("topicName", topic);
      formData.append("file", file);

      const response = await axios.post("/api/rag-upload-pdf", formData);

      setNeedUpload(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            response.data?.message ||
            "PDF uploaded and indexed. Ask your question again.",
        },
      ]);

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    } catch (error) {
      console.error("PDF upload failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I could not upload this PDF. Please check the file and try again.",
        },
      ]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 z-40 rounded-full px-4 py-6 gap-2 shadow-2xl bg-linear-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400"
        onClick={() => setOpen(true)}
      >
        <MessageCircleQuestion size={18} />
        Topic Chat
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg border-slate-800 bg-slate-950 text-slate-50 p-0"
        >
          <SheetHeader className="border-b border-white/10 p-5 pr-12 bg-slate-950/95 backdrop-blur">
            <SheetTitle className="flex items-center gap-2 text-xl text-white">
              <Bot className="text-violet-400" size={20} />
              Home Topic Chat
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              Local LLM answers from Pinecone topic memory. Upload PDF if the topic is new.
            </SheetDescription>
          </SheetHeader>

          <div className="flex h-[calc(100vh-84px)] flex-col">
            <div className="border-b border-white/10 p-4 space-y-3">
              <Input
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="Topic name (example: react-basics)"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
              {needUpload && (
                <div className="space-y-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
                  <p className="text-xs text-amber-100">
                    No records found for this topic. Upload a PDF to create knowledge.
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      ref={fileRef}
                      type="file"
                      accept="application/pdf"
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <Button
                      type="button"
                      onClick={() => void uploadPdf()}
                      disabled={uploading || !topicName.trim()}
                      className="gap-2 bg-amber-500 hover:bg-amber-400 text-black"
                    >
                      {uploading ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Upload size={16} />
                      )}
                      Upload
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 px-4 py-4">
              <div className="space-y-4 pr-2">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        message.role === "user"
                          ? "bg-violet-500 text-white"
                          : "bg-white/5 border border-white/10 text-slate-100"
                      }`}
                    >
                      <p className="whitespace-pre-wrap wrap-break-word leading-6">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-white/10 p-4 space-y-3">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything based on this topic memory..."
                className="min-h-28 resize-none border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void askQuestion();
                  }
                }}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Enter to send, Shift+Enter for new line.
                </p>
                <Button
                  className="gap-2 bg-violet-500 hover:bg-violet-400 text-white"
                  onClick={() => void askQuestion()}
                  disabled={loading || !topicName.trim() || !question.trim()}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                  Ask
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default HomeChatPanel;
