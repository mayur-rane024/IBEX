"use client";

import { useEffect, useEffectEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CircleAlert, MessageSquareText, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import ReplyBox from "@/components/forum/ReplyBox";
import ReplyItem from "@/components/forum/ReplyItem";
import ThreadHeader from "@/components/forum/ThreadHeader";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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

  const fetchThread = useEffectEvent(async (background = false) => {
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
  });

  useEffect(() => {
    void fetchThread(false);
  }, [threadId, fetchThread]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchThread(true);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [threadId, fetchThread]);

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
      await fetchThread(true);
      toast.success("Reply posted anonymously");
    } catch (submitError) {
      throw new Error(
        submitError instanceof Error
          ? submitError.message
          : "Failed to submit reply",
      );
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const highlightedReplies = new Set(highlightedReplyIds);

  return (
    <div className="min-h-[calc(100vh-88px)] bg-[linear-gradient(180deg,#f8fcff_0%,#eef6fb_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            asChild
            variant="outline"
            className="rounded-full border-slate-200 bg-white/85 text-slate-700 shadow-xs hover:bg-white"
          >
            <Link href="/forum">
              <ArrowLeft className="size-4" />
              Back to forum
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => void fetchThread(true)}
            className="rounded-full text-slate-600 hover:bg-white/70"
          >
            <RefreshCcw className="size-4" />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-5">
            <div className="rounded-[30px] border border-slate-200/80 bg-white/90 p-8 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.25)]">
              <Skeleton className="h-6 w-36 rounded-full" />
              <Skeleton className="mt-6 h-10 w-3/4 rounded-xl" />
              <Skeleton className="mt-4 h-5 w-full rounded-lg" />
              <Skeleton className="mt-2 h-5 w-11/12 rounded-lg" />
              <div className="mt-6 flex items-center gap-3">
                <Skeleton className="size-11 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36 rounded-lg" />
                  <Skeleton className="h-3 w-28 rounded-lg" />
                </div>
              </div>
            </div>
            <Skeleton className="h-40 rounded-[28px]" />
            <Skeleton className="h-52 rounded-[28px]" />
          </div>
        ) : error ? (
          <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-5 text-rose-800 shadow-sm">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 size-5 shrink-0" />
              <div className="space-y-1">
                <h2 className="font-semibold">Unable to load thread</h2>
                <p className="text-sm leading-6">{error}</p>
              </div>
            </div>
          </div>
        ) : threadData ? (
          <>
            <ThreadHeader thread={threadData.thread} />

            <section className="space-y-4 rounded-[30px] border border-slate-200/80 bg-white/88 p-6 shadow-[0_22px_60px_-36px_rgba(15,23,42,0.3)] sm:p-7">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-slate-950">
                  Add a reply
                </h2>
                <p className="text-sm leading-6 text-slate-500">
                  Keep it constructive. Your forum identity stays anonymous to
                  everyone else.
                </p>
              </div>
              <ReplyBox
                disabled={isSubmittingReply}
                placeholder="Share your explanation, counterpoint, or follow-up question."
                submitLabel="Post reply"
                onSubmit={(content) => handleReplySubmit(content)}
              />
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">
                    Replies
                  </h2>
                  <p className="text-sm text-slate-500">
                    New replies refresh automatically every few seconds.
                  </p>
                </div>
                <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-xs">
                  {threadData.thread.replyCount}{" "}
                  {threadData.thread.replyCount === 1 ? "reply" : "replies"}
                </div>
              </div>

              {threadData.replies.length === 0 ? (
                <Empty className="rounded-[30px] border-slate-200/80 bg-white/85 py-14 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.25)]">
                  <EmptyHeader>
                    <EmptyMedia variant="icon" className="bg-cyan-50 text-cyan-700">
                      <MessageSquareText className="size-6" />
                    </EmptyMedia>
                    <EmptyTitle>No replies yet</EmptyTitle>
                    <EmptyDescription>
                      Be the first person to respond to this anonymous thread.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-4">
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
          </>
        ) : null}
      </div>
    </div>
  );
}

export default ForumThreadPage;
