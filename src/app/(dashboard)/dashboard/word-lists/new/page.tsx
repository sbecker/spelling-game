"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { parseWordInput, parseCsv } from "@/lib/word-list-parser";

export default function NewWordListPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pasteInput, setPasteInput] = useState("");
  const [csvInput, setCsvInput] = useState("");
  const [manualWord, setManualWord] = useState("");
  const [previewWords, setPreviewWords] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handlePasteParse() {
    const parsed = parseWordInput(pasteInput);
    setPreviewWords((prev) => {
      const combined = [...prev, ...parsed];
      return combined.filter((w, i) => combined.indexOf(w) === i);
    });
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvInput(text);
      const parsed = parseCsv(text);
      setPreviewWords((prev) => {
        const combined = [...prev, ...parsed];
        return combined.filter((w, i) => combined.indexOf(w) === i);
      });
    };
    reader.readAsText(file);
  }

  function handleAddManual() {
    const word = manualWord.trim().toLowerCase();
    if (word && !previewWords.includes(word)) {
      setPreviewWords((prev) => [...prev, word]);
    }
    setManualWord("");
  }

  function handleRemoveWord(word: string) {
    setPreviewWords((prev) => prev.filter((w) => w !== word));
  }

  async function handleSave() {
    setError("");
    if (!name.trim()) {
      setError("Please enter a list name");
      return;
    }
    if (previewWords.length === 0) {
      setError("Please add at least one word");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/word-lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), wordArray: previewWords }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create word list");
      setSaving(false);
      return;
    }

    router.push("/dashboard/word-lists");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold">New Word List</h2>

      <div className="space-y-2">
        <Label htmlFor="list-name">List Name</Label>
        <Input
          id="list-name"
          placeholder='e.g. "Week 12 - April"'
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <Tabs defaultValue="paste">
        <TabsList>
          <TabsTrigger value="paste">Paste Words</TabsTrigger>
          <TabsTrigger value="csv">Upload CSV</TabsTrigger>
          <TabsTrigger value="manual">Add One by One</TabsTrigger>
        </TabsList>

        <TabsContent value="paste" className="space-y-3">
          <Textarea
            placeholder="Enter words separated by commas or new lines..."
            rows={6}
            value={pasteInput}
            onChange={(e) => setPasteInput(e.target.value)}
          />
          <Button variant="outline" onClick={handlePasteParse}>
            Parse Words
          </Button>
        </TabsContent>

        <TabsContent value="csv" className="space-y-3">
          <Input type="file" accept=".csv" onChange={handleCsvUpload} />
          {csvInput && (
            <p className="text-sm text-gray-500">
              CSV loaded. Words added to preview below.
            </p>
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Type a word..."
              value={manualWord}
              onChange={(e) => setManualWord(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddManual();
                }
              }}
            />
            <Button variant="outline" onClick={handleAddManual}>
              Add
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Word Preview ({previewWords.length})
          </CardTitle>
          <CardDescription>
            Review your words before saving. Click a word to remove it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {previewWords.length === 0 ? (
            <p className="text-sm text-gray-400">No words added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {previewWords.map((word) => (
                <button
                  key={word}
                  onClick={() => handleRemoveWord(word)}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm hover:bg-red-100 hover:text-red-700 transition-colors"
                >
                  {word} &times;
                </button>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-3">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 w-full">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Word List"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/word-lists")}
            >
              Cancel
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
