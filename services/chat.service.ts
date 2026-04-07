import { and, asc, eq } from "drizzle-orm";

import { db } from "@/config/db";
import { conversationsTable, messagesTable } from "@/config/schema";
import { ServiceError } from "@/lib/service-error";
import { getOwnedCourseRecord } from "@/services/course.service";
import { ensureUserProfile } from "@/services/user.service";

type MessageRole = "user" | "assistant";

export const generateConversationId = () =>
  `chat_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const createConversation = async (
  userId: string,
  courseId?: string | null,
) => {
  await ensureUserProfile(userId);

  if (courseId) {
    const course = await getOwnedCourseRecord(userId, courseId);
    if (!course) {
      throw new ServiceError(403, "Forbidden");
    }
  }

  const conversationId = generateConversationId();

  const [conversation] = await db
    .insert(conversationsTable)
    .values({
      id: conversationId,
      userId,
      courseId: courseId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return conversation;
};

export const getConversationForUser = async (
  userId: string,
  conversationId: string,
) => {
  const conversations = await db
    .select()
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.id, conversationId),
        eq(conversationsTable.userId, userId),
      ),
    )
    .limit(1);

  if (!conversations[0]) {
    throw new ServiceError(403, "Forbidden");
  }

  return conversations[0];
};

export const getMessages = async (userId: string, conversationId: string) => {
  await getConversationForUser(userId, conversationId);

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(asc(messagesTable.createdAt));

  return messages.map((message) => ({
    role: message.role as MessageRole,
    content: message.content,
    sources: message.sources,
    metadata: message.metadata,
  }));
};

export const addMessage = async (input: {
  userId: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  sources?: unknown;
  metadata?: unknown;
}) => {
  await getConversationForUser(input.userId, input.conversationId);

  await db.insert(messagesTable).values({
    conversationId: input.conversationId,
    role: input.role,
    content: input.content,
    sources: input.sources ?? null,
    metadata: input.metadata ?? null,
    createdAt: new Date(),
  });

  await db
    .update(conversationsTable)
    .set({ updatedAt: new Date() })
    .where(eq(conversationsTable.id, input.conversationId));
};
