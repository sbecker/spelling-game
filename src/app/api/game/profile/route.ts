import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { gameProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json(profile);
}
