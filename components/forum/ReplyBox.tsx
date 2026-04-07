"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { validateCommunityMessage } from "@/lib/community-guidelines";
import { cn } from "@/lib/utils";

type Props = {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  contextLabel?: string;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
};

function ReplyBox({
  onSubmit,
  onCancel,
  contextLabel,
  placeholder = "Write your reply...",
  submitLabel = "Reply",
  autoFocus = false,
  disabled = false,
  className,
}: Props) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationMessage = useMemo(() => {
    if (!content.trim()) {
      return null;
    }

    return validateCommunityMessage(content, { minLength: 4 });
  }, [content]);

  const handleSubmit = async () => {
    const trimmed = content.trim();

    if (!trimmed || disabled || isSubmitting || validationMessage) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(trimmed);
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {contextLabel ? (
        <p className="text-sm text-slate-500">{contextLabel}</p>
      ) : null}
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled || isSubmitting}
        className="min-h-28"
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            void handleSubmit();
          }
        }}
      />
      {validationMessage ? (
        <p className="text-sm text-slate-500">{validationMessage}</p>
      ) : (
        <p className="text-xs text-slate-400">
          Keep it constructive and specific.
        </p>
      )}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => void handleSubmit()}
          disabled={disabled || isSubmitting || !content.trim() || !!validationMessage}
        >
          {isSubmitting ? "Sending..." : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default ReplyBox;
