"use client";

import { useState } from "react";
import { Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
};

function ReplyBox({
  onSubmit,
  onCancel,
  placeholder = "Write your reply...",
  submitLabel = "Reply",
  autoFocus = false,
  disabled = false,
  className,
}: Props) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = content.trim();

    if (!trimmed || disabled || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(trimmed);
      setContent("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit reply",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "space-y-3 rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm",
        className,
      )}
    >
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled || isSubmitting}
        className="min-h-28 resize-none rounded-2xl border-slate-200 bg-slate-50/90 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus-visible:border-cyan-300 focus-visible:ring-cyan-100"
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void handleSubmit();
          }
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Anonymous reply. Press Ctrl/Cmd + Enter to send.
        </p>
        <div className="flex items-center gap-2">
          {onCancel ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
              className="rounded-full text-slate-600 hover:bg-slate-100"
            >
              <X className="size-4" />
              Cancel
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={disabled || isSubmitting || !content.trim()}
            className="rounded-full bg-linear-to-r from-cyan-500 to-sky-500 px-5 text-white shadow-sm hover:from-cyan-400 hover:to-sky-400"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ReplyBox;
