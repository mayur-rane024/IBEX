import { z } from "zod";

export const createForumThreadSchema = z.object({
  title: z.string().trim().min(5).max(255),
  content: z.string().trim().min(1).max(5000),
});

export const createForumReplySchema = z.object({
  threadId: z.string().uuid(),
  content: z.string().trim().min(1).max(5000),
  parentReplyId: z.string().uuid().optional(),
});

export const forumThreadParamsSchema = z.object({
  id: z.string().uuid(),
});

export const forumThreadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
