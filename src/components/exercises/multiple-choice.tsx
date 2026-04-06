"use client";

import { useState, useEffect } from "react";

interface Props {
  options: string[];
  wordId: string;
  onSubmit: (answer: string) => void;
  hint?: string;
  attemptNumber: number;
}

export function MultipleChoice({ options, wordId, onSubmit, hint, attemptNumber }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [tried, setTried] = useState<Set<string>>(new Set());
  const [playing, setPlaying] = useState(false);

  // Reset selection (but keep tried) when attempt changes
  useEffect(() => {
    setSelected(null);
  }, [attemptNumber]);

  async function playAudio() {
    setPlaying(true);
    try {
      const utterance = new SpeechSynthesisUtterance();
      utterance.lang = "en-US";
      utterance.rate = 0.8;
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

  function handleSelect(option: string) {
    setSelected(option);
    setTried((prev) => new Set(prev).add(option));
    onSubmit(option);
  }

  return (
    <div className="space-y-6 text-center">
      <div className="text-2xl font-bold text-blue-700">
        Which spelling is correct?
      </div>
      <p className="text-gray-600">Listen to the word, then pick the right spelling.</p>

      <button
        onClick={playAudio}
        disabled={playing}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-2xl text-white shadow-lg transition-transform hover:scale-105"
      >
        {playing ? "..." : "🔊"}
      </button>

      {hint && (
        <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
          Hint: {hint}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={selected !== null || tried.has(option)}
            className={`rounded-xl border-2 p-4 text-lg font-medium transition-all ${
              tried.has(option) && selected !== option
                ? "border-gray-200 bg-gray-100 text-gray-400"
                : selected === option
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
