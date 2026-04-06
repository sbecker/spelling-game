"use client";

import { useEffect, useState } from "react";
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

interface WordList {
  id: string;
  name: string;
  isBuiltin: boolean;
  createdAt: string;
  wordCount: number;
}

export default function WordListsPage() {
  const [lists, setLists] = useState<WordList[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchLists() {
    const res = await fetch("/api/word-lists");
    const data = await res.json();
    setLists(data);
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/word-lists")
      .then((r) => r.json())
      .then((data) => {
        setLists(data);
        setLoading(false);
      });
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this word list?")) return;
    await fetch(`/api/word-lists/${id}`, { method: "DELETE" });
    fetchLists();
  }

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Word Lists</h2>
        <Link href="/dashboard/word-lists/new">
          <Button>New Word List</Button>
        </Link>
      </div>

      {lists.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No word lists yet. Click &quot;New Word List&quot; to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Card key={list.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{list.name}</CardTitle>
                    <CardDescription>
                      {list.wordCount} word{list.wordCount !== 1 ? "s" : ""}
                    </CardDescription>
                  </div>
                  {list.isBuiltin && (
                    <Badge variant="secondary">Built-in</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Link href={`/dashboard/word-lists/${list.id}`}>
                    <Button variant="outline" size="sm">
                      {list.isBuiltin ? "View" : "Edit"}
                    </Button>
                  </Link>
                  {!list.isBuiltin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(list.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
