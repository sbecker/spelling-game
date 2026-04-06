"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface WordListDetail {
  id: string;
  name: string;
  isBuiltin: boolean;
  words: { id: string; word: string }[];
}

export default function WordListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [list, setList] = useState<WordListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchList() {
      const res = await fetch(`/api/word-lists/${id}`);
      if (!res.ok) {
        router.push("/dashboard/word-lists");
        return;
      }
      const data = await res.json();
      setList(data);
      setName(data.name);
      setWords(data.words.map((w: { word: string }) => w.word));
      setLoading(false);
    }
    fetchList();
  }, [id, router]);

  function handleAddWord() {
    const word = newWord.trim().toLowerCase();
    if (word && !words.includes(word)) {
      setWords((prev) => [...prev, word]);
    }
    setNewWord("");
  }

  function handleRemoveWord(word: string) {
    setWords((prev) => prev.filter((w) => w !== word));
  }

  async function handleSave() {
    setError("");
    setSaving(true);

    const res = await fetch(`/api/word-lists/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), wordArray: words }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push("/dashboard/word-lists");
  }

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (!list) return null;

  const isBuiltin = list.isBuiltin;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold">
          {isBuiltin ? "View" : "Edit"} Word List
        </h2>
        {isBuiltin && <Badge variant="secondary">Built-in</Badge>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="list-name">List Name</Label>
        <Input
          id="list-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isBuiltin}
        />
      </div>

      {!isBuiltin && (
        <div className="flex gap-2">
          <Input
            placeholder="Add a word..."
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddWord();
              }
            }}
          />
          <Button variant="outline" onClick={handleAddWord}>
            Add
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Words ({words.length})
          </CardTitle>
          {!isBuiltin && (
            <CardDescription>Click a word to remove it.</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {words.map((word) => (
              <button
                key={word}
                onClick={() => !isBuiltin && handleRemoveWord(word)}
                className={`rounded-full bg-gray-100 px-3 py-1 text-sm ${
                  isBuiltin
                    ? "cursor-default"
                    : "hover:bg-red-100 hover:text-red-700 transition-colors"
                }`}
                disabled={isBuiltin}
              >
                {word}
                {!isBuiltin && " \u00d7"}
              </button>
            ))}
          </div>
        </CardContent>
        {!isBuiltin && (
          <CardFooter className="flex flex-col items-start gap-3">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 w-full">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/word-lists")}
              >
                Cancel
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
