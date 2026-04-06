import { requireParentSession } from "@/lib/session";
import { db } from "@/db";
import { users, wordLists } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await requireParentSession();

  const children = await db
    .select()
    .from(users)
    .where(
      and(eq(users.parentId, session.user.id), eq(users.role, "child"))
    );

  const lists = await db
    .select()
    .from(wordLists)
    .where(eq(wordLists.createdBy, session.user.id));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Children</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{children.length}</p>
            <p className="text-sm text-gray-500">accounts created</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Word Lists</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{lists.length}</p>
            <p className="text-sm text-gray-500">lists available</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
