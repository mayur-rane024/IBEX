import { db } from "@/config/db";
import { documentsTable } from "@/config/schema";
import { ensureProfile } from "@/services/profile.service";

export const createDocument = async (input: {
  id: string;
  userId: string;
  title: string;
  topicName: string;
  namespace: string | null;
}) => {
  await ensureProfile(input.userId);

  const [document] = await db
    .insert(documentsTable)
    .values({
      id: input.id,
      userId: input.userId,
      title: input.title,
      topicName: input.topicName,
      namespace: input.namespace,
      createdAt: new Date(),
    })
    .returning();

  return document;
};
