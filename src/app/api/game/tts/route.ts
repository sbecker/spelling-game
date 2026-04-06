import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { words } from "@/db/schema";
import { eq } from "drizzle-orm";

// Simple TTS endpoint that returns the word for browser SpeechSynthesis
// Will be upgraded to OpenAI TTS with Vercel Blob caching later
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const wordId = url.searchParams.get("wordId");

  if (!wordId) {
    return NextResponse.json({ error: "wordId required" }, { status: 400 });
  }

  const [word] = await db
    .select()
    .from(words)
    .where(eq(words.id, wordId))
    .limit(1);

  if (!word) {
    return NextResponse.json({ error: "Word not found" }, { status: 404 });
  }

  return NextResponse.json({ word: word.word });
}
