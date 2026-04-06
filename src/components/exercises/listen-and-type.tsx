"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  wordId: string;
  onSubmit: (answer: string) => void;
  hint?: string;
  attemptNumber: number;
}

export function ListenAndType({ wordId, onSubmit, hint, attemptNumber }: Props) {
  const [answer, setAnswer] = useState("");
  const [playing, setPlaying] = useState(false);

  async function playAudio() {
    setPlaying(true);
    try {
      // Use browser TTS as fallback (OpenAI TTS integration comes later)
      const utterance = new SpeechSynthesisUtterance();
      utterance.lang = "en-US";
      utterance.rate = 0.8;
      // Fetch the word from the API to speak it
      const res = await fetch(`/api/game/tts?wordId=${wordId}`);
      if (res.ok) {
        const data = await res.json();
        utterance.text = data.word;
      }
      utterance.onend = () => setPlaying(false);
      speechSynthesis.speak(utterance);
    } catch {
      setPlaying(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (answer.trim()) onSubmit(answer);
  }

  return (
    <div className="space-y-6 text-center">
      <div className="text-2xl font-bold text-blue-700">
        A wild word appeared!
      </div>
      <p className="text-gray-600">Listen carefully, then type the word.</p>

      <Button
        size="lg"
        className="h-16 w-16 rounded-full text-2xl"
        onClick={playAudio}
        disabled={playing}
      >
        {playing ? "..." : "🔊"}
      </Button>

      {hint && (
        <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
          Hint: {hint}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type the word..."
          className="text-center text-xl h-14"
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
        />
        <Button type="submit" size="lg" className="w-full h-14 text-lg">
          {attemptNumber > 1 ? "Try Again!" : "Check!"}
        </Button>
      </form>
    </div>
  );
}
