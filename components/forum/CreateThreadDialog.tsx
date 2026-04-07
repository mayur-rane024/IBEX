"use client";

import { useMemo, useState } from "react";

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
import { validateCommunityMessage } from "@/lib/community-guidelines";
import { ForumThread, readApiResponse } from "@/lib/forum";

type Props = {
  canCreateThread: boolean;
  gateMessage: string | null;
  onCreated: (thread: ForumThread) => void;
};

function CreateThreadDialog({ canCreateThread, gateMessage, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationMessage = useMemo(() => {
    if (!title.trim() && !content.trim()) {
      return null;
    }

    return (
      validateCommunityMessage(title, { minLength: 6 }) ||
      validateCommunityMessage(content, { minLength: 10 })
    );
  }, [content, title]);

  const resetForm = () => {
    setTitle("");
    setContent("");
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (
      !canCreateThread ||
      !trimmedTitle ||
      !trimmedContent ||
      isSubmitting ||
      validationMessage
    ) {
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
      resetForm();
      setOpen(false);
      onCreated(thread);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!canCreateThread) {
          return;
        }

        setOpen(nextOpen);
        if (!nextOpen && !isSubmitting) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <span title={gateMessage ?? undefined}>
          <Button
            disabled={!canCreateThread}
            className="min-w-36"
            aria-disabled={!canCreateThread}
          >
            Ask Question
          </Button>
        </span>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ask an anonymous question</DialogTitle>
          <DialogDescription>
            Your pseudonym and avatar are shown, never your real account details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="thread-title" className="text-sm font-medium text-slate-700">
              Title
            </label>
            <Input
              id="thread-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Summarize your question"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="thread-content" className="text-sm font-medium text-slate-700">
              Details
            </label>
            <Textarea
              id="thread-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Share context, what you tried, and where you're stuck."
              disabled={isSubmitting}
            />
          </div>

          {validationMessage ? (
            <p className="text-sm text-slate-500">{validationMessage}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={
              !canCreateThread ||
              isSubmitting ||
              !title.trim() ||
              !content.trim() ||
              !!validationMessage
            }
          >
            {isSubmitting ? "Posting..." : "Post thread"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateThreadDialog;
