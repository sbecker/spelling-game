"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface BlankInfo {
  position: number;
  letter: string;
  options: string[];
}

interface Props {
  blanks: {
    display: string[];
    blanks: BlankInfo[];
  };
  onSubmit: (answer: string) => void;
  hint?: string;
  attemptNumber: number;
}

export function FillInTheBlanks({ blanks, onSubmit, hint, attemptNumber }: Props) {
  const [filled, setFilled] = useState<Record<number, string>>({});
  const [activeBlank, setActiveBlank] = useState<number>(
    blanks.blanks[0]?.position ?? 0
  );

  function selectLetter(position: number, letter: string) {
    const newFilled = { ...filled, [position]: letter };
    setFilled(newFilled);

    // Auto-advance to next unfilled blank
    const nextBlank = blanks.blanks.find(
      (b) => b.position !== position && !newFilled[b.position]
    );
    if (nextBlank) setActiveBlank(nextBlank.position);
  }

  function handleSubmit() {
    const result = blanks.display.map((ch, i) =>
      filled[i] !== undefined ? filled[i] : ch
    );
    onSubmit(result.join(""));
  }

  const allFilled = blanks.blanks.every((b) => filled[b.position]);
  const currentBlank = blanks.blanks.find((b) => b.position === activeBlank);

  return (
    <div className="space-y-6 text-center">
      <div className="text-2xl font-bold text-blue-700">
        Fill in the missing letters!
      </div>

      {hint && (
        <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
          Hint: {hint}
        </div>
      )}

      {/* Word display */}
      <div className="flex justify-center gap-1">
        {blanks.display.map((ch, i) => {
          const isBlank = ch === "_";
          const isFilled = filled[i] !== undefined;
          const isActive = i === activeBlank;

          return (
            <button
              key={i}
              onClick={() => isBlank && setActiveBlank(i)}
              className={`flex h-12 w-10 items-center justify-center rounded-lg text-xl font-bold transition-colors ${
                isBlank
                  ? isActive
                    ? "border-2 border-blue-500 bg-blue-50 text-blue-700"
                    : isFilled
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-400"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {isFilled ? filled[i] : ch}
            </button>
          );
        })}
      </div>

      {/* Letter options for active blank */}
      {currentBlank && !filled[activeBlank] && (
        <div className="flex justify-center gap-3">
          {currentBlank.options.map((letter) => (
            <button
              key={letter}
              onClick={() => selectLetter(activeBlank, letter)}
              className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-100 text-xl font-bold text-orange-700 shadow transition-transform hover:scale-110 hover:bg-orange-200"
            >
              {letter}
            </button>
          ))}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        size="lg"
        className="h-14 text-lg w-full"
        disabled={!allFilled}
      >
        {attemptNumber > 1 ? "Try Again!" : "Check!"}
      </Button>
    </div>
  );
}
