import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { wordLists, words } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { word } = await request.json();

  if (!word || typeof word !== "string") {
    return NextResponse.json({ error: "Word is required" }, { status: 400 });
  }

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

  const [inserted] = await db
    .insert(words)
    .values({
      word: word.trim().toLowerCase(),
      wordListId: id,
    })
    .returning();

  return NextResponse.json(inserted, { status: 201 });
}
