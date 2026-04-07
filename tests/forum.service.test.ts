import assert from "node:assert/strict";
import test from "node:test";

import { ServiceError } from "@/lib/service-error";
import {
  buildReplyTree,
  createForumService,
  MAX_FORUM_REPLY_DEPTH,
  type ForumStore,
} from "@/services/forum.service";

const NOW = new Date("2026-04-08T00:00:00.000Z");

type ThreadRecord = {
  id: string;
  userId: string;
  title: string;
  content: string;
  pseudonymSnapshot: string;
  avatarSnapshot: string;
  createdAt: Date;
  updatedAt: Date;
};

type ReplyRecord = {
  id: string;
  threadId: string;
  userId: string;
  parentReplyId: string | null;
  content: string;
  pseudonymSnapshot: string;
  avatarSnapshot: string;
  createdAt: Date;
};

const createThreadRecord = (overrides: Partial<ThreadRecord> = {}): ThreadRecord => ({
  id: overrides.id ?? "thread-1",
  userId: overrides.userId ?? "user-1",
  title: overrides.title ?? "Thread title",
  content: overrides.content ?? "Thread content",
  pseudonymSnapshot: overrides.pseudonymSnapshot ?? "HiddenOtterA1B2",
  avatarSnapshot: overrides.avatarSnapshot ?? "bottts-neutral:hiddenottera1b2",
  createdAt: overrides.createdAt ?? NOW,
  updatedAt: overrides.updatedAt ?? NOW,
});

const createReplyRecord = (overrides: Partial<ReplyRecord> = {}): ReplyRecord => ({
  id: overrides.id ?? "reply-1",
  threadId: overrides.threadId ?? "thread-1",
  userId: overrides.userId ?? "user-1",
  parentReplyId: overrides.parentReplyId ?? null,
  content: overrides.content ?? "Reply content",
  pseudonymSnapshot: overrides.pseudonymSnapshot ?? "SilentFoxC3D4",
  avatarSnapshot: overrides.avatarSnapshot ?? "bottts-neutral:silentfoxc3d4",
  createdAt: overrides.createdAt ?? NOW,
});

const createStore = (input?: {
  replies?: ReplyRecord[];
  threads?: ThreadRecord[];
}): ForumStore => {
  const threads = [...(input?.threads ?? [])];
  const replies = [...(input?.replies ?? [])];

  return {
    async countThreads() {
      return threads.length;
    },
    async createReply(reply) {
      replies.push(reply as ReplyRecord);
      return reply as ReplyRecord;
    },
    async createThread(thread) {
      threads.push(thread as ThreadRecord);
      return thread as ThreadRecord;
    },
    async getReplyCountByThreadId(threadId) {
      return replies.filter((reply) => reply.threadId === threadId).length;
    },
    async getReplyCountsByThreadIds(threadIds) {
      return threadIds.map((threadId) => ({
        threadId,
        count: replies.filter((reply) => reply.threadId === threadId).length,
      }));
    },
    async getReplyInThread(threadId, replyId) {
      return (
        replies.find(
          (reply) => reply.threadId === threadId && reply.id === replyId,
        ) ?? null
      );
    },
    async getThreadById(threadId) {
      return threads.find((thread) => thread.id === threadId) ?? null;
    },
    async listRepliesByThreadId(threadId) {
      return replies
        .filter((reply) => reply.threadId === threadId)
        .sort((left, right) =>
          left.createdAt.getTime() - right.createdAt.getTime() ||
          left.id.localeCompare(right.id),
        );
    },
    async listThreads(page, pageSize) {
      const offset = (page - 1) * pageSize;
      return threads
        .slice()
        .sort((left, right) =>
          right.updatedAt.getTime() - left.updatedAt.getTime() ||
          right.createdAt.getTime() - left.createdAt.getTime() ||
          right.id.localeCompare(left.id),
        )
        .slice(offset, offset + pageSize);
    },
    async touchThread(threadId, updatedAt) {
      const thread = threads.find((candidate) => candidate.id === threadId);
      if (thread) {
        thread.updatedAt = updatedAt;
      }
    },
  };
};

test("buildReplyTree nests replies and avoids cycles or orphans becoming circular", () => {
  const replies = [
    createReplyRecord({ id: "r1", parentReplyId: null }),
    createReplyRecord({ id: "r2", parentReplyId: "r1", createdAt: new Date("2026-04-08T00:00:01.000Z") }),
    createReplyRecord({ id: "r3", parentReplyId: "r2", createdAt: new Date("2026-04-08T00:00:02.000Z") }),
    createReplyRecord({ id: "r4", parentReplyId: "missing", createdAt: new Date("2026-04-08T00:00:03.000Z") }),
    createReplyRecord({ id: "r5", parentReplyId: "r6", createdAt: new Date("2026-04-08T00:00:04.000Z") }),
    createReplyRecord({ id: "r6", parentReplyId: "r5", createdAt: new Date("2026-04-08T00:00:05.000Z") }),
  ];

  const tree = buildReplyTree(replies as Parameters<typeof buildReplyTree>[0]);

  assert.equal(tree.length, 4);
  assert.equal(tree[0]?.id, "r1");
  assert.equal(tree[0]?.replies[0]?.id, "r2");
  assert.equal(tree[0]?.replies[0]?.replies[0]?.id, "r3");
  assert.equal(tree[1]?.id, "r4");
  assert.equal(tree[2]?.id, "r5");
  assert.equal(tree[3]?.id, "r6");
});

test("createThread snapshots profile data and does not expose userId", async () => {
  const store = createStore();
  const service = createForumService({
    getNow: () => NOW,
    getProfileByUserId: async () => ({
      id: 1,
      userId: "user-1",
      pseudonym: "BrightCometF00D",
      avatar: "bottts-neutral:brightcometf00d",
      createdAt: NOW,
    }),
    makeId: () => "thread-created",
    store,
  });

  const thread = await service.createThread("user-1", "A title", "A body");

  assert.deepEqual(thread, {
    id: "thread-created",
    title: "A title",
    content: "A body",
    pseudonym: "BrightCometF00D",
    avatar: "bottts-neutral:brightcometf00d",
    createdAt: NOW,
    updatedAt: NOW,
    replyCount: 0,
  });
  assert.equal("userId" in thread, false);
});

test("createReply rejects a parent reply from another thread", async () => {
  const store = createStore({
    threads: [createThreadRecord({ id: "thread-1" })],
    replies: [createReplyRecord({ id: "reply-other", threadId: "thread-2" })],
  });

  const service = createForumService({
    getNow: () => NOW,
    getProfileByUserId: async () => ({
      id: 1,
      userId: "user-1",
      pseudonym: "CalmMaple1234",
      avatar: "bottts-neutral:calmmaple1234",
      createdAt: NOW,
    }),
    makeId: () => "reply-created",
    store,
  });

  await assert.rejects(
    () => service.createReply("user-1", "thread-1", "content", "reply-other"),
    (error: unknown) =>
      error instanceof ServiceError &&
      error.status === 404 &&
      error.message === "Parent reply not found",
  );
});

test("createReply enforces the depth limit", async () => {
  const replies: ReplyRecord[] = [];

  for (let index = 1; index <= MAX_FORUM_REPLY_DEPTH; index++) {
    replies.push(
      createReplyRecord({
        id: `reply-${index}`,
        parentReplyId: index === 1 ? null : `reply-${index - 1}`,
        createdAt: new Date(`2026-04-08T00:00:0${index}.000Z`),
      }),
    );
  }

  const service = createForumService({
    getNow: () => NOW,
    getProfileByUserId: async () => ({
      id: 1,
      userId: "user-1",
      pseudonym: "SwiftRaven9999",
      avatar: "bottts-neutral:swiftraven9999",
      createdAt: NOW,
    }),
    makeId: () => "too-deep",
    store: createStore({
      threads: [createThreadRecord({ id: "thread-1" })],
      replies,
    }),
  });

  await assert.rejects(
    () => service.createReply("user-1", "thread-1", "too deep", `reply-${MAX_FORUM_REPLY_DEPTH}`),
    (error: unknown) =>
      error instanceof ServiceError &&
      error.status === 400 &&
      error.message === "Reply depth limit reached",
  );
});

test("createReply detects corrupted cyclic parent chains", async () => {
  const service = createForumService({
    getNow: () => NOW,
    getProfileByUserId: async () => ({
      id: 1,
      userId: "user-1",
      pseudonym: "MellowEchoABCD",
      avatar: "bottts-neutral:mellowechoabcd",
      createdAt: NOW,
    }),
    makeId: () => "reply-created",
    store: createStore({
      threads: [createThreadRecord({ id: "thread-1" })],
      replies: [
        createReplyRecord({ id: "reply-a", parentReplyId: "reply-b" }),
        createReplyRecord({ id: "reply-b", parentReplyId: "reply-a" }),
      ],
    }),
  });

  await assert.rejects(
    () => service.createReply("user-1", "thread-1", "content", "reply-a"),
    (error: unknown) =>
      error instanceof ServiceError &&
      error.status === 500 &&
      error.message === "Reply hierarchy is corrupted",
  );
});

test("getThreadById returns anonymous thread and reply data only", async () => {
  const service = createForumService({
    getNow: () => NOW,
    getProfileByUserId: async () => {
      throw new Error("not used");
    },
    makeId: () => "unused",
    store: createStore({
      threads: [
        createThreadRecord({
          id: "thread-1",
          userId: "user-secret",
          pseudonymSnapshot: "HiddenPine1A2B",
          avatarSnapshot: "bottts-neutral:hiddenpine1a2b",
        }),
      ],
      replies: [
        createReplyRecord({
          id: "reply-1",
          userId: "user-secret",
          parentReplyId: null,
          pseudonymSnapshot: "HiddenPine1A2B",
          avatarSnapshot: "bottts-neutral:hiddenpine1a2b",
        }),
      ],
    }),
  });

  const result = await service.getThreadById("thread-1");

  assert.equal("userId" in result.thread, false);
  assert.equal(result.thread.pseudonym, "HiddenPine1A2B");
  assert.equal(result.replies[0]?.pseudonym, "HiddenPine1A2B");
  assert.equal(
    result.replies.some((reply) => "userId" in (reply as Record<string, unknown>)),
    false,
  );
});
