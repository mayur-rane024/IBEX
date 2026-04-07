"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CircleAlert, Compass, MessageSquareText } from "lucide-react";

import CreateThreadDialog from "@/components/forum/CreateThreadDialog";
import ThreadCard from "@/components/forum/ThreadCard";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { ForumThread, ForumThreadsResponse, readApiResponse } from "@/lib/forum";

const DEFAULT_LIMIT = 10;

const parsePositiveNumber = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

function ForumListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parsePositiveNumber(searchParams.get("page"), 1);
  const limit = parsePositiveNumber(
    searchParams.get("limit") ?? searchParams.get("pageSize"),
    DEFAULT_LIMIT,
  );

  const [data, setData] = useState<ForumThreadsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadThreads = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/forum/threads?page=${page}&pageSize=${limit}`,
          {
            cache: "no-store",
          },
        );
        const result = await readApiResponse<ForumThreadsResponse>(response);

        if (!cancelled) {
          setData(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load forum threads",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadThreads();

    return () => {
      cancelled = true;
    };
  }, [page, limit]);

  const buildPageHref = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    params.set("limit", String(limit));
    return `/forum?${params.toString()}`;
  };

  return (
    <div className="min-h-[calc(100vh-88px)] bg-[linear-gradient(180deg,#f8fcff_0%,#eef6fb_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_30%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_30%),white] px-6 py-8 shadow-[0_28px_80px_-36px_rgba(15,23,42,0.35)] sm:px-8 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700">
                <Compass className="size-4" />
                Anonymous Forum
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Ask boldly. Learn quietly. Stay anonymous.
                </h1>
                <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
                  IBEX Forum blends community learning with pseudonymous
                  identity, so questions stay honest, replies stay threaded,
                  and personal accounts stay private.
                </p>
              </div>
            </div>
            <CreateThreadDialog
              onCreated={(thread: ForumThread) => {
                router.push(`/forum/${thread.id}`);
              }}
            />
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200/80 bg-white/85 px-6 py-5 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-400">
              Threads
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {data?.pagination.total ?? "--"}
            </p>
          </div>
          <div className="rounded-[28px] border border-slate-200/80 bg-white/85 px-6 py-5 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-400">
              Current page
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{page}</p>
          </div>
          <div className="rounded-[28px] border border-slate-200/80 bg-white/85 px-6 py-5 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)]">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-400">
              Threads per page
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{limit}</p>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">
                Community threads
              </h2>
              <p className="text-sm text-slate-500">
                Browse current anonymous discussions and jump into a thread.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-slate-200 bg-white/80 text-slate-700 shadow-xs hover:bg-white"
            >
              <Link href="/">
                Back home
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.2)]"
                >
                  <Skeleton className="h-6 w-28 rounded-full" />
                  <Skeleton className="mt-5 h-8 w-3/4 rounded-xl" />
                  <Skeleton className="mt-3 h-4 w-full rounded-lg" />
                  <Skeleton className="mt-2 h-4 w-11/12 rounded-lg" />
                  <div className="mt-6 flex items-center gap-3">
                    <Skeleton className="size-11 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 rounded-lg" />
                      <Skeleton className="h-3 w-24 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-5 text-rose-800 shadow-sm">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 size-5 shrink-0" />
                <div className="space-y-1">
                  <h3 className="font-semibold">Forum unavailable</h3>
                  <p className="text-sm leading-6">{error}</p>
                </div>
              </div>
            </div>
          ) : data && data.items.length === 0 ? (
            <Empty className="rounded-[32px] border-slate-200/80 bg-white/85 py-16 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.25)]">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-cyan-50 text-cyan-700">
                  <MessageSquareText className="size-6" />
                </EmptyMedia>
                <EmptyTitle>No threads yet</EmptyTitle>
                <EmptyDescription>
                  Start the first anonymous discussion and give your peers a safe
                  place to respond.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <CreateThreadDialog
                  onCreated={(thread: ForumThread) => {
                    router.push(`/forum/${thread.id}`);
                  }}
                />
              </EmptyContent>
            </Empty>
          ) : (
            <>
              <div className="grid gap-5 lg:grid-cols-2">
                {data?.items.map((thread) => (
                  <ThreadCard key={thread.id} thread={thread} />
                ))}
              </div>
              {data && data.pagination.totalPages > 1 ? (
                <Pagination className="justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={page > 1 ? buildPageHref(page - 1) : "#"}
                        aria-disabled={page <= 1}
                        className={
                          page <= 1 ? "pointer-events-none opacity-50" : ""
                        }
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-xs">
                        Page {page} of {data.pagination.totalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        href={
                          page < data.pagination.totalPages
                            ? buildPageHref(page + 1)
                            : "#"
                        }
                        aria-disabled={page >= data.pagination.totalPages}
                        className={
                          page >= data.pagination.totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default ForumListPage;
