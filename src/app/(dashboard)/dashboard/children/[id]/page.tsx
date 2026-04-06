"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChildProgress {
  child: { id: string; username: string };
  summary: {
    mastered: number;
    learning: number;
    new: number;
    totalWords: number;
  };
  wordProgress: {
    wordId: string;
    word: string;
    listName: string;
    correctCount: number;
    incorrectCount: number;
    easeFactor: number;
    accuracy: number;
    status: "mastered" | "learning" | "new";
  }[];
  listAccuracy: {
    listName: string;
    listId: string;
    totalAttempts: number;
    correctAttempts: number;
    accuracy: number;
  }[];
  recentSessions: {
    id: string;
    startedAt: string;
    totalQuestions: number;
    correctAnswers: number;
  }[];
  gameProfile: {
    totalXp: number;
    level: number;
    currentStreak: number;
    dailyStreak: number;
    earnedBadges: string[];
  } | null;
  srQueue: {
    word: string;
    listName: string;
    nextReviewAt: string;
    isOverdue: boolean;
  }[];
}

export default function ChildProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<ChildProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/children/${id}/progress`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [id]);

  if (loading || !data) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{data.child.username}</h2>
          {data.gameProfile && (
            <p className="text-sm text-gray-500">
              Level {data.gameProfile.level} &middot; {data.gameProfile.totalXp} XP
              &middot; {data.gameProfile.dailyStreak}-day streak
            </p>
          )}
        </div>
        <Link href={`/play`}>
          <Button variant="outline">Play as {data.child.username}</Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-600">Mastered</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.summary.mastered}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-600">Learning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.summary.learning}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">New</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.summary.new}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.summary.totalWords}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="words">
        <TabsList>
          <TabsTrigger value="words">Word Progress</TabsTrigger>
          <TabsTrigger value="lists">List Accuracy</TabsTrigger>
          <TabsTrigger value="sessions">Session History</TabsTrigger>
          <TabsTrigger value="queue">Review Queue</TabsTrigger>
          {data.gameProfile && <TabsTrigger value="badges">Badges</TabsTrigger>}
        </TabsList>

        <TabsContent value="words" className="space-y-2">
          {data.wordProgress.length === 0 ? (
            <p className="text-gray-500 py-4">No progress yet.</p>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-2 text-left font-medium">Word</th>
                    <th className="px-4 py-2 text-left font-medium">List</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2 text-right font-medium">Accuracy</th>
                    <th className="px-4 py-2 text-right font-medium">Correct</th>
                    <th className="px-4 py-2 text-right font-medium">Wrong</th>
                  </tr>
                </thead>
                <tbody>
                  {data.wordProgress.map((w) => (
                    <tr key={w.wordId} className="border-b">
                      <td className="px-4 py-2 font-medium">{w.word}</td>
                      <td className="px-4 py-2 text-gray-500">{w.listName}</td>
                      <td className="px-4 py-2">
                        <Badge
                          variant={
                            w.status === "mastered"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            w.status === "mastered"
                              ? "bg-green-100 text-green-700"
                              : w.status === "learning"
                                ? "bg-yellow-100 text-yellow-700"
                                : ""
                          }
                        >
                          {w.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right">{w.accuracy}%</td>
                      <td className="px-4 py-2 text-right text-green-600">
                        {w.correctCount}
                      </td>
                      <td className="px-4 py-2 text-right text-red-600">
                        {w.incorrectCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="lists" className="space-y-2">
          {data.listAccuracy.length === 0 ? (
            <p className="text-gray-500 py-4">No sessions yet.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {data.listAccuracy.map((l) => (
                <Card key={l.listId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{l.listName}</CardTitle>
                    <CardDescription>
                      {l.totalAttempts} attempts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${l.accuracy}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold">{l.accuracy}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-2">
          {data.recentSessions.length === 0 ? (
            <p className="text-gray-500 py-4">No sessions yet.</p>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-2 text-left font-medium">Date</th>
                    <th className="px-4 py-2 text-right font-medium">
                      Questions
                    </th>
                    <th className="px-4 py-2 text-right font-medium">
                      Correct
                    </th>
                    <th className="px-4 py-2 text-right font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSessions.map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="px-4 py-2">
                        {new Date(s.startedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {s.totalQuestions}
                      </td>
                      <td className="px-4 py-2 text-right text-green-600">
                        {s.correctAnswers}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {s.totalQuestions > 0
                          ? Math.round(
                              (s.correctAnswers / s.totalQuestions) * 100
                            )
                          : 0}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="queue" className="space-y-2">
          {data.srQueue.length === 0 ? (
            <p className="text-gray-500 py-4">No words in review queue.</p>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-2 text-left font-medium">Word</th>
                    <th className="px-4 py-2 text-left font-medium">List</th>
                    <th className="px-4 py-2 text-left font-medium">
                      Next Review
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.srQueue.map((item) => (
                    <tr key={item.word} className="border-b">
                      <td className="px-4 py-2 font-medium">{item.word}</td>
                      <td className="px-4 py-2 text-gray-500">
                        {item.listName}
                      </td>
                      <td className="px-4 py-2">
                        {item.isOverdue ? (
                          <Badge className="bg-red-100 text-red-700">
                            Overdue
                          </Badge>
                        ) : (
                          new Date(item.nextReviewAt).toLocaleDateString()
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {data.gameProfile && (
          <TabsContent value="badges" className="space-y-2">
            {data.gameProfile.earnedBadges.length === 0 ? (
              <p className="text-gray-500 py-4">No badges earned yet.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {data.gameProfile.earnedBadges.map((badge) => (
                  <Card key={badge}>
                    <CardContent className="py-4 text-center">
                      <div className="text-2xl">
                        {badgeEmoji(badge)}
                      </div>
                      <p className="mt-1 text-sm font-medium">
                        {badgeName(badge)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function badgeEmoji(badge: string): string {
  const emojis: Record<string, string> = {
    "master-10": "🥉",
    "master-25": "🥈",
    "master-50": "🥇",
    "streak-7": "🔥",
    "streak-30": "💥",
    "perfect-session": "⭐",
    "complete-list": "📋",
  };
  return emojis[badge] || "🏅";
}

function badgeName(badge: string): string {
  const names: Record<string, string> = {
    "master-10": "Word Master (10)",
    "master-25": "Word Champion (25)",
    "master-50": "Word Legend (50)",
    "streak-7": "Week Warrior",
    "streak-30": "Month Master",
    "perfect-session": "Perfect Session",
    "complete-list": "List Complete",
  };
  return names[badge] || badge;
}
