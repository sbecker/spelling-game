import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  real,
  timestamp,
  unique,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["parent", "child"] }).notNull(),
  parentId: uuid("parent_id").references((): AnyPgColumn => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wordLists = pgTable("word_lists", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdBy: uuid("created_by")
    .references(() => users.id)
    .notNull(),
  isBuiltin: boolean("is_builtin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const words = pgTable("words", {
  id: uuid("id").defaultRandom().primaryKey(),
  word: text("word").notNull(),
  wordListId: uuid("word_list_id")
    .references(() => wordLists.id, { onDelete: "cascade" })
    .notNull(),
});

export const progress = pgTable(
  "progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    wordId: uuid("word_id")
      .references(() => words.id, { onDelete: "cascade" })
      .notNull(),
    correctCount: integer("correct_count").default(0).notNull(),
    incorrectCount: integer("incorrect_count").default(0).notNull(),
    easeFactor: real("ease_factor").default(2.5).notNull(),
    interval: integer("interval").default(0).notNull(),
    nextReviewAt: timestamp("next_review_at"),
  },
  (table) => [unique("progress_user_word").on(table.userId, table.wordId)]
);

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  wordListId: uuid("word_list_id").references(() => wordLists.id),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

export const sessionResults = pgTable("session_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .references(() => sessions.id, { onDelete: "cascade" })
    .notNull(),
  wordId: uuid("word_id")
    .references(() => words.id, { onDelete: "cascade" })
    .notNull(),
  exerciseType: text("exercise_type", {
    enum: [
      "listen_and_type",
      "unscramble",
      "fill_in_the_blanks",
      "multiple_choice",
      "flash_memory",
    ],
  }).notNull(),
  correct: boolean("correct").notNull(),
  attemptNumber: integer("attempt_number").notNull(),
});
