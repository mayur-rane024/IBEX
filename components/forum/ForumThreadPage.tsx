"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import ReplyBox from "@/components/forum/ReplyBox";
import ReplyItem from "@/components/forum/ReplyItem";
import ThreadHeader from "@/components/forum/ThreadHeader";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Divider } from "@/components/ui/divider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  flattenReplyIds,
  ForumReply,
  ForumThreadDetail,
  readApiResponse,
} from "@/lib/forum";

type Props = {
  threadId: string;
};

const POLL_INTERVAL_MS = 8000;

function ForumThreadPage({ threadId }: Props) {
  const [threadData, setThreadData] = useState<ForumThreadDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [highlightedReplyIds, setHighlightedReplyIds] = useState<string[]>([]);
  const [pendingScrollReplyId, setPendingScrollReplyId] = useState<string | null>(
    null,
  );
  const [showRootReplyBox, setShowRootReplyBox] = useState(false);

  const fetchThread = useCallback(
    async (options?: { background?: boolean }) => {
      const background = options?.background ?? false;

      if (!background) {
        setIsLoading(true);
      }

      try {
        const response = await fetch(`/api/forum/thread/${threadId}`, {
          cache: "no-store",
        });
        const nextThreadData = await readApiResponse<ForumThreadDetail>(response);

        setThreadData((previous) => {
          if (previous) {
            const previousIds = new Set(flattenReplyIds(previous.replies));
            const nextIds = flattenReplyIds(nextThreadData.replies);
            const freshIds = nextIds.filter((id) => !previousIds.has(id));

            if (freshIds.length > 0) {
              setHighlightedReplyIds((current) =>
                Array.from(new Set([...current, ...freshIds])),
              );

              window.setTimeout(() => {
                setHighlightedReplyIds((current) =>
                  current.filter((id) => !freshIds.includes(id)),
                );
              }, 6000);
            }
          }

          return nextThreadData;
        });

        setError(null);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load thread discussion",
        );
      } finally {
        if (!background) {
          setIsLoading(false);
        }
      }
    },
    [threadId],
  );

  useEffect(() => {
    void fetchThread();
  }, [fetchThread]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchThread({ background: true });
      }
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchThread]);

  useEffect(() => {
    if (!pendingScrollReplyId) {
      return;
    }

    const element = document.getElementById(`reply-${pendingScrollReplyId}`);

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    setPendingScrollReplyId(null);
  }, [threadData, pendingScrollReplyId]);

  const handleReplySubmit = async (content: string, parentReplyId?: string) => {
    setIsSubmittingReply(true);

    try {
      const response = await fetch("/api/forum/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId,
          content,
          parentReplyId,
        }),
      });

      const reply = await readApiResponse<ForumReply>(response);
      setHighlightedReplyIds((current) =>
        Array.from(new Set([...current, reply.id])),
      );
      setPendingScrollReplyId(reply.id);
      setShowRootReplyBox(false);
      await fetchThread({ background: true });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const highlightedReplies = new Set(highlightedReplyIds);

  return (
    <main className="py-12 sm:py-16">
      <Container size="lg" className="space-y-8">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/forum">Back to forum</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void fetchThread({ background: true })}
          >
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/5" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-11/12" />
            </div>
            <Divider />
            <div className="space-y-5">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : error ? (
          <div className="text-sm text-slate-500">{error}</div>
        ) : threadData ? (
          <div className="space-y-8">
            <ThreadHeader thread={threadData.thread} />

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Replies</h2>
                  <p className="text-sm text-slate-500">
                    {threadData.thread.replyCount}{" "}
                    {threadData.thread.replyCount === 1 ? "reply" : "replies"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRootReplyBox((current) => !current)}
                >
                  Reply to thread
                </Button>
              </div>

              {showRootReplyBox ? (
                <ReplyBox
                  autoFocus
                  disabled={isSubmittingReply}
                  contextLabel="Replying to thread"
                  placeholder="Share your reply..."
                  submitLabel="Reply"
                  onCancel={() => setShowRootReplyBox(false)}
                  onSubmit={(content) => handleReplySubmit(content)}
                />
              ) : null}

              <Divider />

              {threadData.replies.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No replies yet. Be the first to respond.
                </p>
              ) : (
                <div className="space-y-6">
                  {threadData.replies.map((reply) => (
                    <ReplyItem
                      key={reply.id}
                      reply={reply}
                      highlightedReplyIds={highlightedReplies}
                      onReply={handleReplySubmit}
                      isSubmitting={isSubmittingReply}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </Container>
    </main>
  );
}

export default ForumThreadPage;
