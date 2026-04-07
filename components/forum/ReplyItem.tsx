"use client";

import { useState } from "react";

import ForumIdentity from "@/components/forum/ForumIdentity";
import ReplyBox from "@/components/forum/ReplyBox";
import { Button } from "@/components/ui/button";
import { ForumReply, formatForumTimestamp } from "@/lib/forum";

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
  const visualDepth = Math.min(depth, 4);
  const isHighlighted = highlightedReplyIds?.has(reply.id);

  return (
    <div
      id={`reply-${reply.id}`}
      className={`space-y-3 ${visualDepth > 0 ? "ml-4 border-l border-slate-200 pl-4" : ""}`}
    >
      <div
        className={`space-y-3 rounded-xl px-2 py-1 ${isHighlighted ? "bg-indigo-50/80" : ""}`}
      >
        <ForumIdentity
          pseudonym={reply.pseudonym}
          avatar={reply.avatar}
          timestamp={formatForumTimestamp(reply.createdAt)}
        />
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
          {reply.content}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowReplyBox((current) => !current)}
          className="h-auto px-0 text-sm text-slate-500 hover:bg-transparent hover:text-slate-900"
        >
          Reply
        </Button>
      </div>

      {showReplyBox ? (
        <ReplyBox
          autoFocus
          disabled={isSubmitting}
          contextLabel={`Replying to @${reply.pseudonym}`}
          placeholder={`Reply to ${reply.pseudonym}...`}
          submitLabel="Reply"
          onCancel={() => setShowReplyBox(false)}
          onSubmit={async (content) => {
            await onReply(content, reply.id);
            setShowReplyBox(false);
          }}
        />
      ) : null}

      {reply.replies.length > 0 ? (
        <div className="space-y-4">
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
