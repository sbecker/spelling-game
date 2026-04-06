import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { hash } from "bcryptjs";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

const SECOND_GRADE_WORDS = {
  "Dolch Sight Words": [
    "always", "around", "because", "been", "before", "best", "both", "buy",
    "call", "cold", "does", "don't", "fast", "first", "five", "found",
    "gave", "goes", "green", "its", "made", "many", "off", "or", "pull",
    "read", "right", "sing", "sit", "sleep", "tell", "their", "these",
    "those", "upon", "us", "use", "very", "wash", "which", "why", "wish",
    "work", "would", "write", "your",
  ],
  "Common Spelling Words": [
    "about", "again", "animal", "answer", "bear", "began", "below",
    "between", "build", "carry", "change", "children", "city", "close",
    "country", "earth", "enough", "every", "example", "family", "follow",
    "food", "friend", "girl", "great", "head", "house", "important",
    "keep", "kind", "large", "learn", "letter", "light", "might", "mother",
    "move", "near", "night", "often", "only", "own", "paper", "people",
    "place", "plant", "point", "school", "should", "small", "sound",
    "spell", "start", "story", "study", "talk", "think", "together",
    "tree", "turn", "under", "watch", "water", "while", "world", "young",
  ],
};

async function seed() {
  console.log("Seeding database...");

  // Create parent user (password: "parent123")
  const parentHash = await hash("parent123", 10);
  const [parent] = await db
    .insert(schema.users)
    .values({
      username: "parent",
      passwordHash: parentHash,
      role: "parent",
    })
    .returning();
  console.log(`Created parent: ${parent.username} (id: ${parent.id})`);

  // Create child user (password: "child123")
  const childHash = await hash("child123", 10);
  const [child] = await db
    .insert(schema.users)
    .values({
      username: "ash",
      passwordHash: childHash,
      role: "child",
      parentId: parent.id,
    })
    .returning();
  console.log(`Created child: ${child.username} (id: ${child.id})`);

  // Create built-in word lists
  for (const [listName, wordArray] of Object.entries(SECOND_GRADE_WORDS)) {
    const [list] = await db
      .insert(schema.wordLists)
      .values({
        name: listName,
        createdBy: parent.id,
        isBuiltin: true,
      })
      .returning();

    const wordRows = wordArray.map((word) => ({
      word,
      wordListId: list.id,
    }));

    await db.insert(schema.words).values(wordRows);
    console.log(`Created list "${listName}" with ${wordArray.length} words`);
  }

  // Create a sample custom word list
  const [customList] = await db
    .insert(schema.wordLists)
    .values({
      name: "Week 1 - Practice",
      createdBy: parent.id,
      isBuiltin: false,
    })
    .returning();

  const customWords = [
    "thought", "through", "caught", "brought", "enough",
    "laugh", "cough", "rough", "tough", "daughter",
  ];

  const customWordRows = customWords.map((word) => ({
    word,
    wordListId: customList.id,
  }));

  const insertedWords = await db
    .insert(schema.words)
    .values(customWordRows)
    .returning();
  console.log(`Created custom list "Week 1 - Practice" with ${customWords.length} words`);

  // Add some sample progress for the child
  const now = new Date();
  const progressEntries = insertedWords.slice(0, 5).map((word, i) => {
    // First 2 words: mastered, next 2: learning, last 1: struggling
    if (i < 2) {
      return {
        userId: child.id,
        wordId: word.id,
        correctCount: 8,
        incorrectCount: 1,
        easeFactor: 2.8,
        interval: 14,
        nextReviewAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      };
    } else if (i < 4) {
      return {
        userId: child.id,
        wordId: word.id,
        correctCount: 3,
        incorrectCount: 2,
        easeFactor: 2.2,
        interval: 3,
        nextReviewAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      };
    } else {
      return {
        userId: child.id,
        wordId: word.id,
        correctCount: 1,
        incorrectCount: 4,
        easeFactor: 1.5,
        interval: 1,
        nextReviewAt: now,
      };
    }
  });

  await db.insert(schema.progress).values(progressEntries);
  console.log(`Added progress entries for ${progressEntries.length} words`);

  console.log("\nSeed complete!");
  console.log("Parent login: parent / parent123");
  console.log("Child login:  ash / child123");

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
