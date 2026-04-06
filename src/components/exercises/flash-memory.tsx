"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  word: string;
  displayTime: number;
  onSubmit: (answer: string) => void;
  hint?: string;
  attemptNumber: number;
}

export function FlashMemory({ word, displayTime, onSubmit, hint, attemptNumber }: Props) {
  const [phase, setPhase] = useState<"showing" | "typing">(
    attemptNumber > 1 ? "typing" : "showing"
  );
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (phase !== "showing") return;
    const timer = setTimeout(() => setPhase("typing"), displayTime);
    return () => clearTimeout(timer);
  }, [phase, displayTime]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (answer.trim()) onSubmit(answer);
  }

  if (phase === "showing") {
    return (
      <div className="space-y-6 text-center">
        <div className="text-2xl font-bold text-blue-700">
          Quick, memorize this word!
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <span className="text-5xl font-bold tracking-wider text-gray-900">
            {word}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-blue-500 transition-all ease-linear"
            style={{
              animation: `shrink ${displayTime}ms linear forwards`,
            }}
          />
        </div>
        <style>{`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="text-2xl font-bold text-blue-700">
        Now type it from memory!
      </div>

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
