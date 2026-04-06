import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    if (session.user.role === "parent") {
      redirect("/dashboard");
    } else {
      redirect("/play");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-blue-50 p-4">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-black text-blue-700">
          Spelling Game
        </h1>
        <p className="text-xl text-gray-600 max-w-md">
          A fun, Pokemon-themed spelling practice app for kids.
          Practice words, earn XP, and become a spelling master!
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="h-14 text-lg px-8">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="outline" className="h-14 text-lg px-8">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
