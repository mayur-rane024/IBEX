import { eq } from "drizzle-orm";

import { db } from "@/config/db";
import { profilesTable, usersTable } from "@/config/schema";

const buildPseudonym = (userId: string) =>
  `Learner-${userId.slice(-6).toUpperCase()}`;

const buildAvatar = (userId: string) => `seed:${userId.slice(-12)}`;

export const ensureUserProfile = async (userId: string) => {
  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!existingUser[0]) {
    await db.insert(usersTable).values({
      id: userId,
      createdAt: new Date(),
    });
  }

  const existingProfile = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .limit(1);

  if (existingProfile[0]) {
    return existingProfile[0];
  }

  const [createdProfile] = await db
    .insert(profilesTable)
    .values({
      userId,
      pseudonym: buildPseudonym(userId),
      avatar: buildAvatar(userId),
      createdAt: new Date(),
    })
    .returning();

  return createdProfile;
};
