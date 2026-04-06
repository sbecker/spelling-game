import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import {
  users,
  progress,
  words,
  wordLists,
  sessions,
  sessionResults,
  gameProfiles,
} from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: childId } = await params;

  // Verify this child belongs to the parent
  const [child] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, childId),
        eq(users.parentId, session.user.id),
        eq(users.role, "child")
      )
    )
    .limit(1);

  if (!child) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get all progress records with word details
  const progressRows = await db
    .select({
      wordId: progress.wordId,
      word: words.word,
      listName: wordLists.name,
      correctCount: progress.correctCount,
      incorrectCount: progress.incorrectCount,
      easeFactor: progress.easeFactor,
      interval: progress.interval,
      nextReviewAt: progress.nextReviewAt,
    })
    .from(progress)
    .innerJoin(words, eq(progress.wordId, words.id))
    .innerJoin(wordLists, eq(words.wordListId, wordLists.id))
    .where(eq(progress.userId, childId));

  // Categorize words
  const mastered = progressRows.filter(
    (p) => p.easeFactor >= 2.5 && p.correctCount >= 5
  );
  const learning = progressRows.filter(
    (p) => !(p.easeFactor >= 2.5 && p.correctCount >= 5) && p.correctCount > 0
  );

  // Get total word count for "new" calculation
  const parentId = session.user.id;
  const totalWords = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(words)
    .innerJoin(wordLists, eq(words.wordListId, wordLists.id))
    .where(
      sql`${wordLists.createdBy} = ${parentId} OR ${wordLists.isBuiltin} = true`
    );

  const totalWordCount = totalWords[0]?.count ?? 0;
  const newCount = totalWordCount - progressRows.length;

  // Accuracy per list
  const listAccuracy = await db
    .select({
      listName: wordLists.name,
      listId: wordLists.id,
      totalAttempts: sql<number>`count(${sessionResults.id})::int`,
      correctAttempts: sql<number>`sum(case when ${sessionResults.correct} then 1 else 0 end)::int`,
    })
    .from(sessionResults)
    .innerJoin(sessions, eq(sessionResults.sessionId, sessions.id))
    .innerJoin(words, eq(sessionResults.wordId, words.id))
    .innerJoin(wordLists, eq(words.wordListId, wordLists.id))
    .where(eq(sessions.userId, childId))
    .groupBy(wordLists.id, wordLists.name);

  // Recent sessions
  const recentSessions = await db
    .select({
      id: sessions.id,
      startedAt: sessions.startedAt,
      endedAt: sessions.endedAt,
      wordListId: sessions.wordListId,
      totalQuestions: sql<number>`count(${sessionResults.id})::int`,
      correctAnswers: sql<number>`sum(case when ${sessionResults.correct} then 1 else 0 end)::int`,
    })
    .from(sessions)
    .leftJoin(sessionResults, eq(sessionResults.sessionId, sessions.id))
    .where(eq(sessions.userId, childId))
    .groupBy(sessions.id)
    .orderBy(desc(sessions.startedAt))
    .limit(20);

  // Game profile
  const [gameProfile] = await db
    .select()
    .from(gameProfiles)
    .where(eq(gameProfiles.userId, childId))
    .limit(1);

  // Spaced repetition queue (upcoming reviews)
  const now = new Date();
  const srQueue = progressRows
    .filter((p) => p.nextReviewAt !== null)
    .sort((a, b) => a.nextReviewAt!.getTime() - b.nextReviewAt!.getTime())
    .slice(0, 20)
    .map((p) => ({
      word: p.word,
      listName: p.listName,
      nextReviewAt: p.nextReviewAt,
      isOverdue: p.nextReviewAt! <= now,
    }));

  return NextResponse.json({
    child: { id: child.id, username: child.username },
    summary: {
      mastered: mastered.length,
      learning: learning.length,
      new: newCount,
      totalWords: totalWordCount,
    },
    wordProgress: progressRows.map((p) => ({
      ...p,
      accuracy:
        p.correctCount + p.incorrectCount > 0
          ? Math.round(
              (p.correctCount / (p.correctCount + p.incorrectCount)) * 100
            )
          : 0,
      status:
        p.easeFactor >= 2.5 && p.correctCount >= 5
          ? "mastered"
          : p.correctCount > 0
            ? "learning"
            : "new",
    })),
    listAccuracy: listAccuracy.map((l) => ({
      ...l,
      accuracy:
        l.totalAttempts > 0
          ? Math.round((l.correctAttempts / l.totalAttempts) * 100)
          : 0,
    })),
    recentSessions,
    gameProfile: gameProfile || null,
    srQueue,
  });
}
