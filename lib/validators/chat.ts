import { z } from "zod";

export const homeChatRequestSchema = z.object({
  topicName: z.string().trim().min(1).max(255),
  question: z.string().trim().min(1).max(4000),
  conversationId: z.string().trim().min(1).max(255).optional(),
});

export const courseChatRequestSchema = z.object({
  courseId: z.string().trim().min(1).max(255),
  question: z.string().trim().min(1).max(4000),
  conversationId: z.string().trim().min(1).max(255).optional(),
});

export const conversationQuerySchema = z.object({
  conversationId: z.string().trim().min(1).max(255),
});
