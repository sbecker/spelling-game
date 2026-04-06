import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { wordLists, words } from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lists = await db
    .select({
      id: wordLists.id,
      name: wordLists.name,
      isBuiltin: wordLists.isBuiltin,
      createdAt: wordLists.createdAt,
      wordCount: sql<number>`count(${words.id})::int`,
    })
    .from(wordLists)
    .leftJoin(words, eq(words.wordListId, wordLists.id))
    .where(
      or(
        eq(wordLists.createdBy, session.user.id),
        eq(wordLists.isBuiltin, true)
      )
    )
    .groupBy(wordLists.id)
    .orderBy(wordLists.createdAt);

  return NextResponse.json(lists);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, wordArray } = await request.json();

  if (!name || !wordArray || !Array.isArray(wordArray) || wordArray.length === 0) {
    return NextResponse.json(
      { error: "Name and at least one word are required" },
      { status: 400 }
    );
  }

  const [list] = await db
    .insert(wordLists)
    .values({
      name,
      createdBy: session.user.id,
      isBuiltin: false,
    })
    .returning();

  const wordRows = wordArray.map((word: string) => ({
    word: word.trim().toLowerCase(),
    wordListId: list.id,
  }));

  await db.insert(words).values(wordRows);

  return NextResponse.json(
    { ...list, wordCount: wordRows.length },
    { status: 201 }
  );
}
