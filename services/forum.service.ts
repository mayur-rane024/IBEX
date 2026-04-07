import { randomUUID } from "node:crypto";

import {
  and,
  asc,
  desc,
  eq,
  inArray,
  sql,
} from "drizzle-orm";

import { forumRepliesTable, forumThreadsTable } from "@/config/schema";
import { ServiceError } from "@/lib/service-error";

export const MAX_FORUM_REPLY_DEPTH = 5;

type ForumThreadRecord = typeof forumThreadsTable.$inferSelect;
type ForumReplyRecord = typeof forumRepliesTable.$inferSelect;

type ForumProfile = {
  pseudonym: string;
  avatar: string;
};

export type ForumStore = {
  countThreads: () => Promise<number>;
  createReply: (input: {
    id: string;
    threadId: string;
    userId: string;
    parentReplyId: string | null;
    content: string;
    pseudonymSnapshot: string;
    avatarSnapshot: string;
    createdAt: Date;
  }) => Promise<ForumReplyRecord>;
  createThread: (input: {
    id: string;
    userId: string;
    title: string;
    content: string;
    pseudonymSnapshot: string;
    avatarSnapshot: string;
    createdAt: Date;
    updatedAt: Date;
  }) => Promise<ForumThreadRecord>;
  getReplyCountByThreadId: (threadId: string) => Promise<number>;
  getReplyCountsByThreadIds: (
    threadIds: string[],
  ) => Promise<Array<{ threadId: string; count: number }>>;
  getReplyInThread: (
    threadId: string,
    replyId: string,
  ) => Promise<ForumReplyRecord | null>;
  getThreadById: (threadId: string) => Promise<ForumThreadRecord | null>;
  listRepliesByThreadId: (threadId: string) => Promise<ForumReplyRecord[]>;
  listThreads: (page: number, pageSize: number) => Promise<ForumThreadRecord[]>;
  touchThread: (threadId: string, updatedAt: Date) => Promise<void>;
};

export type ForumServiceDependencies = {
  getNow: () => Date;
  getProfileByUserId: (userId: string) => Promise<ForumProfile>;
  makeId: () => string;
  store: ForumStore;
};

export type ForumThreadView = {
  id: string;
  title: string;
  content: string;
  pseudonym: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
  replyCount: number;
};

export type ForumReplyView = {
  id: string;
  content: string;
  pseudonym: string;
  avatar: string;
  createdAt: Date;
  replies: ForumReplyView[];
};

const defaultStore: ForumStore = {
  async countThreads() {
    const { db } = await import("@/config/db");
    const results = await db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(forumThreadsTable);

    return results[0]?.count ?? 0;
  },
  async createReply(input) {
    const { db } = await import("@/config/db");
    const [reply] = await db
      .insert(forumRepliesTable)
      .values(input)
      .returning();

    return reply;
  },
  async createThread(input) {
    const { db } = await import("@/config/db");
    const [thread] = await db
      .insert(forumThreadsTable)
      .values(input)
      .returning();

    return thread;
  },
  async getReplyCountByThreadId(threadId) {
    const { db } = await import("@/config/db");
    const results = await db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(forumRepliesTable)
      .where(eq(forumRepliesTable.threadId, threadId));

    return results[0]?.count ?? 0;
  },
  async getReplyCountsByThreadIds(threadIds) {
    if (threadIds.length === 0) {
      return [];
    }

    const { db } = await import("@/config/db");
    return db
      .select({
        threadId: forumRepliesTable.threadId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(forumRepliesTable)
      .where(inArray(forumRepliesTable.threadId, threadIds))
      .groupBy(forumRepliesTable.threadId);
  },
  async getReplyInThread(threadId, replyId) {
    const { db } = await import("@/config/db");
    const replies = await db
      .select()
      .from(forumRepliesTable)
      .where(
        and(
          eq(forumRepliesTable.id, replyId),
          eq(forumRepliesTable.threadId, threadId),
        ),
      )
      .limit(1);

    return replies[0] ?? null;
  },
  async getThreadById(threadId) {
    const { db } = await import("@/config/db");
    const threads = await db
      .select()
      .from(forumThreadsTable)
      .where(eq(forumThreadsTable.id, threadId))
      .limit(1);

    return threads[0] ?? null;
  },
  async listRepliesByThreadId(threadId) {
    const { db } = await import("@/config/db");
    return db
      .select()
      .from(forumRepliesTable)
      .where(eq(forumRepliesTable.threadId, threadId))
      .orderBy(asc(forumRepliesTable.createdAt), asc(forumRepliesTable.id));
  },
  async listThreads(page, pageSize) {
    const offset = (page - 1) * pageSize;

    const { db } = await import("@/config/db");
    return db
      .select()
      .from(forumThreadsTable)
      .orderBy(
        desc(forumThreadsTable.updatedAt),
        desc(forumThreadsTable.createdAt),
        desc(forumThreadsTable.id),
      )
      .limit(pageSize)
      .offset(offset);
  },
  async touchThread(threadId, updatedAt) {
    const { db } = await import("@/config/db");
    await db
      .update(forumThreadsTable)
      .set({ updatedAt })
      .where(eq(forumThreadsTable.id, threadId));
  },
};

const getDefaultProfileByUserId = async (userId: string) => {
  const { getProfile } = await import("@/services/profile.service");
  return getProfile(userId);
};

const defaultDependencies: ForumServiceDependencies = {
  getNow: () => new Date(),
  getProfileByUserId: getDefaultProfileByUserId,
  makeId: () => randomUUID(),
  store: defaultStore,
};

const mapThread = (
  thread: ForumThreadRecord,
  replyCount: number,
): ForumThreadView => ({
  id: thread.id,
  title: thread.title,
  content: thread.content,
  pseudonym: thread.pseudonymSnapshot,
  avatar: thread.avatarSnapshot,
  createdAt: thread.createdAt,
  updatedAt: thread.updatedAt,
  replyCount,
});

const mapReply = (reply: ForumReplyRecord): ForumReplyView => ({
  id: reply.id,
  content: reply.content,
  pseudonym: reply.pseudonymSnapshot,
  avatar: reply.avatarSnapshot,
  createdAt: reply.createdAt,
  replies: [],
});

const resolveReplyDepth = async (
  store: ForumStore,
  threadId: string,
  parentReplyId?: string,
) => {
  if (!parentReplyId) {
    return 0;
  }

  let depth = 1;
  let currentParentId: string | null = parentReplyId;
  const visited = new Set<string>();

  while (currentParentId) {
    if (visited.has(currentParentId)) {
      throw new ServiceError(500, "Reply hierarchy is corrupted");
    }

    visited.add(currentParentId);

    const reply = await store.getReplyInThread(threadId, currentParentId);

    if (!reply) {
      throw new ServiceError(404, "Parent reply not found");
    }

    currentParentId = reply.parentReplyId;
    if (currentParentId) {
      depth += 1;
    }
  }

  return depth;
};

const wouldCreateTreeCycle = (
  replyId: string,
  parentReplyId: string | null,
  parentById: Map<string, string | null>,
) => {
  let currentParentId = parentReplyId;
  const visited = new Set<string>([replyId]);

  while (currentParentId) {
    if (visited.has(currentParentId)) {
      return true;
    }

    visited.add(currentParentId);
    currentParentId = parentById.get(currentParentId) ?? null;
  }

  return false;
};

export const buildReplyTree = (replies: ForumReplyRecord[]) => {
  const nodeMap = new Map<string, ForumReplyView>();
  const parentById = new Map<string, string | null>();
  const roots: ForumReplyView[] = [];

  replies.forEach((reply) => {
    nodeMap.set(reply.id, mapReply(reply));
    parentById.set(reply.id, reply.parentReplyId ?? null);
  });

  replies.forEach((reply) => {
    const node = nodeMap.get(reply.id);

    if (!node) {
      return;
    }

    const parentReplyId = reply.parentReplyId ?? null;
    const parentNode = parentReplyId ? nodeMap.get(parentReplyId) : null;

    if (
      parentReplyId &&
      parentNode &&
      !wouldCreateTreeCycle(reply.id, parentReplyId, parentById)
    ) {
      parentNode.replies.push(node);
      return;
    }

    roots.push(node);
  });

  return roots;
};

export const createForumService = (
  dependencies: ForumServiceDependencies = defaultDependencies,
) => {
  const { getNow, getProfileByUserId, makeId, store } = dependencies;

  const getRepliesForThread = async (threadId: string) => {
    const replies = await store.listRepliesByThreadId(threadId);
    return buildReplyTree(replies);
  };

  const createReplyForThread = async (
    userId: string,
    threadId: string,
    content: string,
    parentReplyId?: string,
  ) => {
    const thread = await store.getThreadById(threadId);

    if (!thread) {
      throw new ServiceError(404, "Thread not found");
    }

    const depth = await resolveReplyDepth(store, threadId, parentReplyId);

    if (depth >= MAX_FORUM_REPLY_DEPTH) {
      throw new ServiceError(400, "Reply depth limit reached");
    }

    const profile = await getProfileByUserId(userId);
    const now = getNow();

    const reply = await store.createReply({
      id: makeId(),
      threadId,
      userId,
      parentReplyId: parentReplyId ?? null,
      content,
      pseudonymSnapshot: profile.pseudonym,
      avatarSnapshot: profile.avatar,
      createdAt: now,
    });

    await store.touchThread(threadId, now);

    return mapReply(reply);
  };

  const createThreadForUser = async (
    userId: string,
    title: string,
    content: string,
  ) => {
    const profile = await getProfileByUserId(userId);
    const now = getNow();

    const thread = await store.createThread({
      id: makeId(),
      userId,
      title,
      content,
      pseudonymSnapshot: profile.pseudonym,
      avatarSnapshot: profile.avatar,
      createdAt: now,
      updatedAt: now,
    });

    return mapThread(thread, 0);
  };

  const getThreadByIdForUser = async (threadId: string) => {
    const thread = await store.getThreadById(threadId);

    if (!thread) {
      throw new ServiceError(404, "Thread not found");
    }

    const [replies, replyCount] = await Promise.all([
      getRepliesForThread(threadId),
      store.getReplyCountByThreadId(threadId),
    ]);

    return {
      thread: mapThread(thread, replyCount),
      replies,
    };
  };

  const getPaginatedThreads = async ({
    page = 1,
    pageSize = 20,
  }: {
    page?: number;
    pageSize?: number;
  }) => {
    const [total, threads] = await Promise.all([
      store.countThreads(),
      store.listThreads(page, pageSize),
    ]);

    const replyCountMap = new Map<string, number>();

    const replyCounts = await store.getReplyCountsByThreadIds(
      threads.map((thread) => thread.id),
    );

    replyCounts.forEach((replyCount) => {
      replyCountMap.set(replyCount.threadId, replyCount.count);
    });

    return {
      items: threads.map((thread) =>
        mapThread(thread, replyCountMap.get(thread.id) ?? 0),
      ),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  };

  return {
    createReply: createReplyForThread,
    createThread: createThreadForUser,
    getReplies: getRepliesForThread,
    getThreadById: getThreadByIdForUser,
    getThreads: getPaginatedThreads,
  };
};

const forumService = createForumService();

export const createThread = forumService.createThread;
export const getReplies = forumService.getReplies;
export const getThreadById = forumService.getThreadById;
export const getThreads = forumService.getThreads;
export const createReply = forumService.createReply;
