import {
  integer,
  json,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: varchar({ length: 255 }).primaryKey(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const profilesTable = pgTable("profiles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar({ length: 255 })
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  pseudonym: varchar({ length: 255 }).notNull(),
  avatar: varchar({ length: 1024 }),
  createdAt: timestamp().defaultNow().notNull(),
});

export const coursesTable = pgTable("courses", {
  id: varchar({ length: 255 }).primaryKey(),
  userId: varchar({ length: 255 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: varchar({ length: 255 }).notNull(),
  prompt: text().notNull(),
  type: varchar({ length: 100 }).notNull(),
  layout: json().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const slidesTable = pgTable("slides", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  courseId: varchar({ length: 255 })
    .notNull()
    .references(() => coursesTable.id, { onDelete: "cascade" }),
  chapterId: varchar({ length: 255 }).notNull(),
  slideKey: varchar({ length: 255 }).notNull(),
  slideIndex: integer().notNull(),
  audioFileName: varchar({ length: 255 }).notNull(),
  videoUrl: varchar({ length: 1024 }).notNull(),
  narration: json().notNull(),
  content: json().notNull(),
  html: text(),
  revealData: json().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const conversationsTable = pgTable("conversations", {
  id: varchar({ length: 255 }).primaryKey(),
  userId: varchar({ length: 255 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  courseId: varchar({ length: 255 }).references(() => coursesTable.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const messagesTable = pgTable("messages", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  conversationId: varchar({ length: 255 })
    .notNull()
    .references(() => conversationsTable.id, { onDelete: "cascade" }),
  role: varchar({ length: 50 }).notNull(),
  content: text().notNull(),
  sources: json(),
  metadata: json(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const documentsTable = pgTable("documents", {
  id: varchar({ length: 255 }).primaryKey(),
  userId: varchar({ length: 255 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: varchar({ length: 255 }).notNull(),
  topicName: varchar({ length: 255 }).notNull(),
  namespace: varchar({ length: 255 }),
  createdAt: timestamp().defaultNow().notNull(),
});
