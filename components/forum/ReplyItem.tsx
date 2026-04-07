"use client";

import { useState } from "react";
import { CornerDownRight, MessageSquareReply } from "lucide-react";

import ForumIdentity from "@/components/forum/ForumIdentity";
import ReplyBox from "@/components/forum/ReplyBox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ForumReply, formatForumTimestamp } from "@/lib/forum";
import { cn } from "@/lib/utils";

type Props = {
  reply: ForumReply;
  depth?: number;
  highlightedReplyIds?: Set<string>;
  onReply: (content: string, parentReplyId?: string) => Promise<void>;
  isSubmitting?: boolean;
};

function ReplyItem({
  reply,
  depth = 0,
  highlightedReplyIds,
  onReply,
  isSubmitting = false,
}: Props) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const visualDepth = Math.min(depth, 3);
  const isHighlighted = highlightedReplyIds?.has(reply.id);

  return (
    <div
      id={`reply-${reply.id}`}
      style={{ marginLeft: `${visualDepth * 20}px` }}
      className={cn("space-y-3", depth > 0 && "relative")}
    >
      <Card
        className={cn(
          "gap-0 overflow-hidden rounded-[24px] border-slate-200/85 bg-white/88 py-0 shadow-[0_14px_40px_-26px_rgba(15,23,42,0.4)] transition-colors",
          depth > 0 &&
            "before:absolute before:top-0 before:-left-4 before:h-full before:w-px before:bg-linear-to-b before:from-cyan-200 before:to-transparent",
          isHighlighted && "border-cyan-300 bg-cyan-50/70 ring-2 ring-cyan-100",
        )}
      >
        <CardContent className="space-y-4 px-5 py-5 sm:px-6">
          <ForumIdentity
            pseudonym={reply.pseudonym}
            avatar={reply.avatar}
            timestamp={formatForumTimestamp(reply.createdAt)}
          />
          <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700">
            {reply.content}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyBox((current) => !current)}
              className="rounded-full px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            >
              <MessageSquareReply className="size-4" />
              Reply
            </Button>
            {depth > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <CornerDownRight className="size-3.5" />
                Nested reply
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {showReplyBox ? (
        <ReplyBox
          autoFocus
          disabled={isSubmitting}
          placeholder={`Reply to ${reply.pseudonym}...`}
          submitLabel="Post reply"
          onCancel={() => setShowReplyBox(false)}
          onSubmit={async (content) => {
            await onReply(content, reply.id);
            setShowReplyBox(false);
          }}
          className="bg-slate-50/90"
        />
      ) : null}

      {reply.replies.length > 0 ? (
        <div className="space-y-3">
          {reply.replies.map((childReply) => (
            <ReplyItem
              key={childReply.id}
              reply={childReply}
              depth={depth + 1}
              highlightedReplyIds={highlightedReplyIds}
              onReply={onReply}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default ReplyItem;
