import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { wordLists, words } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [list] = await db
    .select()
    .from(wordLists)
    .where(eq(wordLists.id, id))
    .limit(1);

  if (!list) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const wordRows = await db
    .select({ id: words.id, word: words.word })
    .from(words)
    .where(eq(words.wordListId, id));

  return NextResponse.json({ ...list, words: wordRows });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { name, wordArray } = await request.json();

  const [list] = await db
    .select()
    .from(wordLists)
    .where(
      and(eq(wordLists.id, id), eq(wordLists.createdBy, session.user.id))
    )
    .limit(1);

  if (!list) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (name) {
    await db
      .update(wordLists)
      .set({ name })
      .where(eq(wordLists.id, id));
  }

  if (wordArray && Array.isArray(wordArray)) {
    // Delete existing words and replace
    await db.delete(words).where(eq(words.wordListId, id));
    if (wordArray.length > 0) {
      const wordRows = wordArray.map((word: string) => ({
        word: word.trim().toLowerCase(),
        wordListId: id,
      }));
      await db.insert(words).values(wordRows);
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [list] = await db
    .select()
    .from(wordLists)
    .where(
      and(eq(wordLists.id, id), eq(wordLists.createdBy, session.user.id))
    )
    .limit(1);

  if (!list) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (list.isBuiltin) {
    return NextResponse.json(
      { error: "Cannot delete built-in lists" },
      { status: 403 }
    );
  }

  await db.delete(wordLists).where(eq(wordLists.id, id));

  return NextResponse.json({ success: true });
}
