import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { sessions, words, wordLists, progress } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { selectDueWords, getMasteryTier } from "@/lib/spaced-repetition";
import { selectExerciseType, generateScrambledLetters, generateBlanks, generateMisspellings } from "@/lib/exercise-engine";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { wordListId } = await request.json();

  // Create a new game session
  const sessionRows = await db
    .insert(sessions)
    .values({
      userId: session.user.id,
      wordListId: wordListId || null,
    })
    .returning();
  const gameSession = sessionRows[0];

  return NextResponse.json(gameSession, { status: 201 });
}

// GET: fetch next exercise for active session
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  const wordListId = url.searchParams.get("wordListId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  // Get the game session
  const [gameSession] = await db
    .select()
    .from(sessions)
    .where(
      and(eq(sessions.id, sessionId), eq(sessions.userId, session.user.id))
    )
    .limit(1);

  if (!gameSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Get words for the session — either from a specific list or all available
  const targetListId = wordListId || gameSession.wordListId;

  let availableWords;
  if (targetListId) {
    // Focus mode: specific list
    availableWords = await db
      .select({ id: words.id, word: words.word, wordListId: words.wordListId })
      .from(words)
      .where(eq(words.wordListId, targetListId));
  } else {
    // Practice mode: all words from lists the user's parent created
    const parentId = session.user.parentId || session.user.id;
    availableWords = await db
      .select({ id: words.id, word: words.word, wordListId: words.wordListId })
      .from(words)
      .innerJoin(wordLists, eq(words.wordListId, wordLists.id))
      .where(
        or(
          eq(wordLists.createdBy, parentId),
          eq(wordLists.isBuiltin, true)
        )
      );
  }

  if (availableWords.length === 0) {
    return NextResponse.json({ error: "No words available" }, { status: 404 });
  }

  // Get progress for these words
  const progressRows = await db
    .select()
    .from(progress)
    .where(eq(progress.userId, session.user.id));

  const progressMap = new Map(
    progressRows.map((p) => [p.wordId, p])
  );

  // Build due word list
  const dueInput = availableWords.map((w) => {
    const p = progressMap.get(w.id);
    return {
      wordId: w.id,
      word: w.word,
      nextReviewAt: p?.nextReviewAt ?? null,
      easeFactor: p?.easeFactor ?? 2.5,
      interval: p?.interval ?? 0,
      correctCount: p?.correctCount ?? 0,
    };
  });

  const dueWords = selectDueWords(dueInput);

  if (dueWords.length === 0) {
    // All words reviewed and not yet due — pick the one due soonest
    const sorted = [...dueInput].sort((a, b) => {
      if (!a.nextReviewAt) return -1;
      if (!b.nextReviewAt) return 1;
      return a.nextReviewAt.getTime() - b.nextReviewAt.getTime();
    });
    dueWords.push(sorted[0]);
  }

  // Pick the first due word
  const targetWordData = dueWords[0] as typeof dueInput[number];
  const targetWord = availableWords.find((w) => w.id === targetWordData.wordId)!;

  // Determine mastery tier and exercise type
  const tier = getMasteryTier(
    targetWordData.easeFactor,
    targetWordData.correctCount
  );
  const exerciseType = selectExerciseType(tier);

  // Generate exercise data based on type
  const exerciseData: Record<string, unknown> = {
    wordId: targetWord.id,
    word: targetWord.word,
    exerciseType,
    tier,
  };

  switch (exerciseType) {
    case "unscramble":
      exerciseData.scrambledLetters = generateScrambledLetters(targetWord.word);
      break;
    case "fill_in_the_blanks":
      exerciseData.blanks = generateBlanks(targetWord.word);
      break;
    case "multiple_choice": {
      const misspellings = generateMisspellings(targetWord.word);
      const options = [targetWord.word, ...misspellings].sort(
        () => Math.random() - 0.5
      );
      exerciseData.options = options;
      // Don't send the word for multiple choice — they need to identify it
      delete exerciseData.word;
      exerciseData.wordLength = targetWord.word.length;
      break;
    }
    case "flash_memory":
      // Word will be shown briefly then hidden — word is included
      exerciseData.displayTime = targetWord.word.length <= 4 ? 2000 : 3000;
      break;
    case "listen_and_type":
      // Client will use TTS — word is not shown
      delete exerciseData.word;
      break;
  }

  return NextResponse.json(exerciseData);
}
