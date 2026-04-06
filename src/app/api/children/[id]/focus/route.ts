import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Note: focus list is stored as a simple convention — the child's game
// checks for a focus_list_id query param. The parent sets it by providing
// a URL. A more robust approach would add a focus_list_id column to users.

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

  const { wordListId } = await request.json();

  // Return the focus URL for the child
  const focusUrl = wordListId ? `/play?list=${wordListId}` : "/play";

  return NextResponse.json({ focusUrl });
}
