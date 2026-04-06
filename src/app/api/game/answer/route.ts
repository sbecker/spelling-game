import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { progress, sessionResults, words, gameProfiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { calculateNextReview, type ProgressState } from "@/lib/spaced-repetition";
import { calculateXp, checkLevelUp, updateStreak, checkBadges, type GameState, type BadgeId } from "@/lib/gamification";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId, wordId, exerciseType, answer, attemptNumber } =
    await request.json();

  if (!sessionId || !wordId || !exerciseType || answer === undefined || !attemptNumber) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Get the word to check the answer
  const [word] = await db
    .select()
    .from(words)
    .where(eq(words.id, wordId))
    .limit(1);

  if (!word) {
    return NextResponse.json({ error: "Word not found" }, { status: 404 });
  }

  const correct = answer.trim().toLowerCase() === word.word.toLowerCase();

  // Record the result
  await db.insert(sessionResults).values({
    sessionId,
    wordId,
    exerciseType,
    correct,
    attemptNumber,
  });

  // Update spaced repetition progress (only on final attempt: first try or second try)
  const shouldUpdateProgress = attemptNumber === 1 || attemptNumber === 2;

  if (shouldUpdateProgress) {
    // Only update SR on the final outcome for this word in this round
    const isSecondAttempt = attemptNumber === 2;
    const isFinalAttempt = correct || isSecondAttempt;

    if (isFinalAttempt) {
      const [existing] = await db
        .select()
        .from(progress)
        .where(
          and(
            eq(progress.userId, session.user.id),
            eq(progress.wordId, wordId)
          )
        )
        .limit(1);

      const currentState: ProgressState = existing
        ? {
            correctCount: existing.correctCount,
            incorrectCount: existing.incorrectCount,
            easeFactor: existing.easeFactor,
            interval: existing.interval,
            nextReviewAt: existing.nextReviewAt,
          }
        : {
            correctCount: 0,
            incorrectCount: 0,
            easeFactor: 2.5,
            interval: 0,
            nextReviewAt: null,
          };

      const updated = calculateNextReview(currentState, correct);

      if (existing) {
        await db
          .update(progress)
          .set({
            correctCount: updated.correctCount,
            incorrectCount: updated.incorrectCount,
            easeFactor: updated.easeFactor,
            interval: updated.interval,
            nextReviewAt: updated.nextReviewAt,
          })
          .where(eq(progress.id, existing.id));
      } else {
        await db.insert(progress).values({
          userId: session.user.id,
          wordId,
          correctCount: updated.correctCount,
          incorrectCount: updated.incorrectCount,
          easeFactor: updated.easeFactor,
          interval: updated.interval,
          nextReviewAt: updated.nextReviewAt,
        });
      }
    }
  }

  // Update gamification
  let xpGained = 0;
  let newLevel: number | undefined;
  let leveledUp = false;
  let newBadges: BadgeId[] = [];
  let newStreak = 0;

  const isFinalAttempt = correct || attemptNumber === 2;
  if (isFinalAttempt) {
    // Get or create game profile
    let [profile] = await db
      .select()
      .from(gameProfiles)
      .where(eq(gameProfiles.userId, session.user.id))
      .limit(1);

    if (!profile) {
      const rows = await db
        .insert(gameProfiles)
        .values({ userId: session.user.id })
        .returning();
      profile = rows[0];
    }

    newStreak = updateStreak(profile.currentStreak, correct);
    xpGained = calculateXp(correct, attemptNumber, profile.currentStreak);
    const newTotalXp = profile.totalXp + xpGained;

    const levelResult = checkLevelUp(newTotalXp, profile.totalXp);
    newLevel = levelResult.level;
    leveledUp = levelResult.leveledUp;

    // Check daily streak
    const now = new Date();
    let dailyStreak = profile.dailyStreak;
    if (profile.lastPlayedAt) {
      const lastPlayed = new Date(profile.lastPlayedAt);
      const daysDiff = Math.floor(
        (now.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff === 1) {
        dailyStreak++;
      } else if (daysDiff > 1) {
        dailyStreak = 1;
      }
    } else {
      dailyStreak = 1;
    }

    // Count mastered words (ease_factor >= 2.5 and correctCount >= 5)
    const masteredWords = await db
      .select()
      .from(progress)
      .where(eq(progress.userId, session.user.id));
    const masteredCount = masteredWords.filter(
      (p) => p.easeFactor >= 2.5 && p.correctCount >= 5
    ).length;

    const gameState: GameState = {
      totalXp: newTotalXp,
      level: newLevel,
      currentStreak: newStreak,
      dailyStreak,
      masteredWordCount: masteredCount,
      perfectSessions: 0, // TODO: track perfect sessions
      completedLists: 0, // TODO: track completed lists
      earnedBadges: (profile.earnedBadges || []) as BadgeId[],
    };

    newBadges = checkBadges(gameState);

    await db
      .update(gameProfiles)
      .set({
        totalXp: newTotalXp,
        level: newLevel,
        currentStreak: newStreak,
        dailyStreak,
        lastPlayedAt: now,
        earnedBadges: [...(profile.earnedBadges || []), ...newBadges],
      })
      .where(eq(gameProfiles.id, profile.id));
  }

  // Build response
  const response: Record<string, unknown> = {
    correct,
    correctAnswer: word.word,
    xpGained,
    streak: newStreak,
  };

  if (leveledUp && newLevel) {
    response.levelUp = newLevel;
  }

  if (newBadges.length > 0) {
    response.newBadges = newBadges;
  }

  // If wrong on first attempt, provide a hint
  if (!correct && attemptNumber === 1) {
    response.hint = generateHint(word.word, answer);
    response.canRetry = true;
  } else {
    response.canRetry = false;
  }

  // If wrong on second attempt, show the diff
  if (!correct && attemptNumber === 2) {
    response.diff = highlightDiff(word.word, answer);
  }

  return NextResponse.json(response);
}

function generateHint(correctWord: string, attempt: string): string {
  const attemptLower = attempt.trim().toLowerCase();

  // Show first letter hint
  if (attemptLower[0] !== correctWord[0]) {
    return `The word starts with "${correctWord[0]}"`;
  }

  // Show word length
  if (attemptLower.length !== correctWord.length) {
    return `The word has ${correctWord.length} letters`;
  }

  // Find first wrong letter
  for (let i = 0; i < correctWord.length; i++) {
    if (attemptLower[i] !== correctWord[i]) {
      return `Check the ${ordinal(i + 1)} letter`;
    }
  }

  return `Try again carefully!`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function highlightDiff(
  correct: string,
  attempt: string
): { letter: string; status: "correct" | "wrong" | "missing" }[] {
  const result: { letter: string; status: "correct" | "wrong" | "missing" }[] =
    [];
  const attemptLower = attempt.trim().toLowerCase();

  for (let i = 0; i < correct.length; i++) {
    if (i < attemptLower.length && attemptLower[i] === correct[i]) {
      result.push({ letter: correct[i], status: "correct" });
    } else if (i < attemptLower.length) {
      result.push({ letter: correct[i], status: "wrong" });
    } else {
      result.push({ letter: correct[i], status: "missing" });
    }
  }

  return result;
}
