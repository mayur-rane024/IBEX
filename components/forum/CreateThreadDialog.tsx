"use client";

import { useState } from "react";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ForumThread, readApiResponse } from "@/lib/forum";

type Props = {
  onCreated: (thread: ForumThread) => void;
};

function CreateThreadDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setContent("");
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/forum/thread", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          content: trimmedContent,
        }),
      });

      const thread = await readApiResponse<ForumThread>(response);
      toast.success("Thread published anonymously");
      resetForm();
      setOpen(false);
      onCreated(thread);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create thread",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen && !isSubmitting) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="rounded-full bg-linear-to-r from-cyan-500 to-sky-500 px-5 text-white shadow-sm hover:from-cyan-400 hover:to-sky-400">
          <MessageSquarePlus className="size-4" />
          Create Thread
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-[28px] border-slate-200 bg-white/95 p-0 shadow-[0_28px_80px_-30px_rgba(15,23,42,0.35)]">
        <DialogHeader className="gap-3 border-b border-slate-100 px-6 py-6 sm:px-8">
          <DialogTitle className="text-2xl text-slate-950">
            Start an anonymous thread
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-slate-500">
            Your forum identity will appear only as your pseudonym and avatar.
            No personal account details are shown to others.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 px-6 py-6 sm:px-8">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="thread-title"
            >
              Title
            </label>
            <Input
              id="thread-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What would you like to ask the community?"
              disabled={isSubmitting}
              className="h-12 rounded-2xl border-slate-200 bg-slate-50/90 px-4 text-slate-900 placeholder:text-slate-400 focus-visible:border-cyan-300 focus-visible:ring-cyan-100"
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="thread-content"
            >
              Description
            </label>
            <Textarea
              id="thread-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Share the context, what you tried, and what you want help with."
              disabled={isSubmitting}
              className="min-h-44 rounded-2xl border-slate-200 bg-slate-50/90 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus-visible:border-cyan-300 focus-visible:ring-cyan-100"
            />
          </div>
        </div>
        <DialogFooter className="border-t border-slate-100 px-6 py-5 sm:px-8">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
            className="rounded-full text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="rounded-full bg-linear-to-r from-cyan-500 to-sky-500 px-5 text-white shadow-sm hover:from-cyan-400 hover:to-sky-400"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MessageSquarePlus className="size-4" />
            )}
            Publish thread
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateThreadDialog;
