import { requireParentSession } from "@/lib/session";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireParentSession();

  return (
    <div className="flex min-h-screen">
      <DashboardNav username={session.user.name} />
      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  );
}
