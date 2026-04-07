"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import CreateThreadDialog from "@/components/forum/CreateThreadDialog";
import ThreadCard from "@/components/forum/ThreadCard";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/ui/container";
import { Divider } from "@/components/ui/divider";
import { Skeleton } from "@/components/ui/skeleton";
import { ForumThread, ForumThreadsResponse, readApiResponse } from "@/lib/forum";

type Props = {
  canCreateThread: boolean;
  gateMessage: string | null;
};

const DEFAULT_LIMIT = 10;

const parsePositiveNumber = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

function ForumListPage({ canCreateThread, gateMessage }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parsePositiveNumber(searchParams.get("page"), 1);
  const limit = parsePositiveNumber(
    searchParams.get("limit") ?? searchParams.get("pageSize"),
    DEFAULT_LIMIT,
  );

  const [search, setSearch] = useState("");
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
          { cache: "no-store" },
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
              : "Failed to fetch threads",
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
  }, [limit, page]);

  const filteredThreads = useMemo(() => {
    const items = data?.items ?? [];
    const query = search.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((thread) =>
      [thread.title, thread.content, thread.pseudonym]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [data?.items, search]);

  const goToPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    params.set("limit", String(limit));
    router.push(`/forum?${params.toString()}`);
  };

  return (
    <main className="py-12 sm:py-16">
      <Container size="lg" className="space-y-8">
        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
              Forum
            </p>
            <h1 className="text-4xl font-bold text-slate-950">
              Anonymous discussions
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-500">
              Ask carefully, reply thoughtfully, and let curiosity take the lead.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-xl flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search threads"
                className="pl-10"
              />
            </div>
            <div className="space-y-1">
              <CreateThreadDialog
                canCreateThread={canCreateThread}
                gateMessage={gateMessage}
                onCreated={(thread: ForumThread) => {
                  router.push(`/forum/${thread.id}`);
                }}
              />
              {!canCreateThread && gateMessage ? (
                <p className="text-sm text-slate-500">{gateMessage}.</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white">
          {isLoading ? (
            <div className="divide-y divide-border px-6 py-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="space-y-3 py-5">
                  <Skeleton className="h-6 w-2/5" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="px-6 py-6 text-sm text-slate-500">{error}</div>
          ) : filteredThreads.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              {search.trim()
                ? "No threads match your search."
                : "No discussions yet."}
            </div>
          ) : (
            <ul className="divide-y divide-border px-4 sm:px-6">
              {filteredThreads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </ul>
          )}
        </section>

        {data && data.pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 text-sm text-slate-500">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {page} of {data.pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= data.pagination.totalPages}
              className="transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </Container>
    </main>
  );
}

export default ForumListPage;
