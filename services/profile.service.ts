import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "@/config/db";
import { profilesTable, usersTable } from "@/config/schema";

const ADJECTIVES = [
  "Curious",
  "Steady",
  "Bright",
  "Calm",
  "Silent",
  "Swift",
  "Mellow",
  "Clever",
  "Hidden",
  "Nimble",
];

const NOUNS = [
  "Otter",
  "Comet",
  "Fox",
  "Raven",
  "Maple",
  "Harbor",
  "Quartz",
  "Pine",
  "Falcon",
  "Echo",
];

const pick = (values: string[]) =>
  values[Math.floor(Math.random() * values.length)] || values[0];

const buildPseudonym = () => {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
  return `${pick(ADJECTIVES)}${pick(NOUNS)}${suffix}`;
};

const buildAvatar = (pseudonym: string) =>
  `bottts-neutral:${pseudonym.toLowerCase()}`;

const ensureUserRecord = async (userId: string) => {
  await db
    .insert(usersTable)
    .values({
      id: userId,
      createdAt: new Date(),
    })
    .onConflictDoNothing({ target: usersTable.id });

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  return user;
};

export const ensureProfile = async (userId: string) => {
  await ensureUserRecord(userId);

  const existingProfile = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .limit(1);

  if (existingProfile[0]?.pseudonym && existingProfile[0]?.avatar) {
    return existingProfile[0];
  }

  if (existingProfile[0]) {
    const pseudonym = existingProfile[0].pseudonym || buildPseudonym();
    const avatar = existingProfile[0].avatar || buildAvatar(pseudonym);

    const [updatedProfile] = await db
      .update(profilesTable)
      .set({
        pseudonym,
        avatar,
      })
      .where(eq(profilesTable.id, existingProfile[0].id))
      .returning();

    return updatedProfile;
  }

  const pseudonym = buildPseudonym();
  const avatar = buildAvatar(pseudonym);

  const [createdProfile] = await db
    .insert(profilesTable)
    .values({
      userId,
      pseudonym,
      avatar,
      createdAt: new Date(),
    })
    .onConflictDoNothing({ target: profilesTable.userId })
    .returning();

  if (createdProfile) {
    return createdProfile;
  }

  const [resolvedProfile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .limit(1);

  if (!resolvedProfile) {
    throw new Error("Failed to resolve profile after creation");
  }

  if (resolvedProfile.pseudonym && resolvedProfile.avatar) {
    return resolvedProfile;
  }

  const [updatedProfile] = await db
    .update(profilesTable)
    .set({
      pseudonym: resolvedProfile.pseudonym || pseudonym,
      avatar:
        resolvedProfile.avatar ||
        buildAvatar(resolvedProfile.pseudonym || pseudonym),
    })
    .where(eq(profilesTable.id, resolvedProfile.id))
    .returning();

  return updatedProfile;
};

export const getProfile = async (userId: string) => ensureProfile(userId);
