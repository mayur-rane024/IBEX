import { randomUUID } from "node:crypto";

import { currentUser } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";

import { db } from "@/config/db";
import { profilesTable, usersTable } from "@/config/schema";
import { AppRole, DEFAULT_APP_ROLE, isAppRole } from "@/lib/auth-role";

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

let usersSchemaReady: Promise<void> | null = null;

const ensureUsersSchema = async () => {
  if (!usersSchemaReady) {
    usersSchemaReady = db
      .execute(sql`
        ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "role" varchar(20) DEFAULT 'user' NOT NULL
      `)
      .then(() => undefined)
      .catch((error) => {
        usersSchemaReady = null;
        throw error;
      });
  }

  return usersSchemaReady;
};

const getUserRecord = async (userId: string) => {
  await ensureUsersSchema();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  return user ?? null;
};

const getClerkRole = async (userId: string): Promise<AppRole | null> => {
  try {
    const user = await currentUser();

    if (!user || user.id !== userId) {
      return null;
    }

    const role = user.unsafeMetadata?.role;

    return isAppRole(role) ? role : null;
  } catch {
    return null;
  }
};

const ensureUserRecord = async (userId: string, role?: AppRole) => {
  await ensureUsersSchema();

  const existingUser = await getUserRecord(userId);

  if (role && existingUser?.role !== role) {
    if (!existingUser) {
      const [createdUser] = await db
        .insert(usersTable)
        .values({
          id: userId,
          role,
          createdAt: new Date(),
        })
        .returning();

      return createdUser;
    }

    const [updatedUser] = await db
      .update(usersTable)
      .set({
        role,
      })
      .where(eq(usersTable.id, userId))
      .returning();

    return updatedUser;
  }

  if (existingUser && existingUser.role !== DEFAULT_APP_ROLE) {
    return existingUser;
  }

  const clerkRole = await getClerkRole(userId);

  if (existingUser) {
    if (clerkRole && clerkRole !== existingUser.role) {
      const [updatedUser] = await db
        .update(usersTable)
        .set({
          role: clerkRole,
        })
        .where(eq(usersTable.id, userId))
        .returning();

      return updatedUser;
    }

    return existingUser;
  }

  await db
    .insert(usersTable)
    .values({
      id: userId,
      role: clerkRole ?? DEFAULT_APP_ROLE,
      createdAt: new Date(),
    })
    .onConflictDoNothing({ target: usersTable.id });

  return getUserRecord(userId);
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

export const syncUserRecord = async (userId: string) => ensureUserRecord(userId);

export const regenerateProfile = async (userId: string) => {
  const profile = await ensureProfile(userId);
  const pseudonym = buildPseudonym();
  const avatar = buildAvatar(pseudonym);

  const [updatedProfile] = await db
    .update(profilesTable)
    .set({
      pseudonym,
      avatar,
    })
    .where(eq(profilesTable.id, profile.id))
    .returning();

  return updatedProfile;
};
