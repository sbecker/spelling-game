import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users, progress, words } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: childId } = await params;

  // Verify child belongs to parent
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

  const { wordId, wordListId } = await request.json();

  if (wordId) {
    // Reset progress for a single word
    await db
      .delete(progress)
      .where(
        and(eq(progress.userId, childId), eq(progress.wordId, wordId))
      );
  } else if (wordListId) {
    // Reset progress for all words in a list
    const listWords = await db
      .select({ id: words.id })
      .from(words)
      .where(eq(words.wordListId, wordListId));

    const wordIds = listWords.map((w) => w.id);
    if (wordIds.length > 0) {
      await db
        .delete(progress)
        .where(
          and(
            eq(progress.userId, childId),
            inArray(progress.wordId, wordIds)
          )
        );
    }
  } else {
    return NextResponse.json(
      { error: "wordId or wordListId required" },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
