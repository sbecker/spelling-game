"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  letters: string[];
  onSubmit: (answer: string) => void;
  hint?: string;
  attemptNumber: number;
}

export function Unscramble({ letters, onSubmit, hint, attemptNumber }: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [available, setAvailable] = useState<number[]>(
    letters.map((_, i) => i)
  );

  function selectLetter(index: number) {
    setSelected((prev) => [...prev, index]);
    setAvailable((prev) => prev.filter((i) => i !== index));
  }

  function deselectLetter(selectedIndex: number) {
    const letterIndex = selected[selectedIndex];
    setSelected((prev) => prev.filter((_, i) => i !== selectedIndex));
    setAvailable((prev) => [...prev, letterIndex].sort((a, b) => a - b));
  }

  function handleSubmit() {
    const answer = selected.map((i) => letters[i]).join("");
    onSubmit(answer);
  }

  function handleReset() {
    setSelected([]);
    setAvailable(letters.map((_, i) => i));
  }

  return (
    <div className="space-y-6 text-center">
      <div className="text-2xl font-bold text-blue-700">
        Unscramble this word!
      </div>
      <p className="text-gray-600">Tap the letters in the right order.</p>

      {hint && (
        <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
          Hint: {hint}
        </div>
      )}

      {/* Selected letters */}
      <div className="flex justify-center gap-2 min-h-[56px]">
        {selected.map((letterIndex, selectedIndex) => (
          <button
            key={`selected-${selectedIndex}`}
            onClick={() => deselectLetter(selectedIndex)}
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500 text-xl font-bold text-white shadow-md transition-transform hover:scale-105"
          >
            {letters[letterIndex]}
          </button>
        ))}
        {selected.length === 0 && (
          <div className="flex h-12 items-center text-gray-400">
            Tap letters below...
          </div>
        )}
      </div>

      {/* Available letters */}
      <div className="flex flex-wrap justify-center gap-2">
        {available.map((letterIndex) => (
          <button
            key={`available-${letterIndex}`}
            onClick={() => selectLetter(letterIndex)}
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200 text-xl font-bold text-gray-700 shadow transition-transform hover:scale-105 hover:bg-gray-300"
          >
            {letters[letterIndex]}
          </button>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <Button
          onClick={handleSubmit}
          size="lg"
          className="h-14 text-lg px-8"
          disabled={selected.length !== letters.length}
        >
          {attemptNumber > 1 ? "Try Again!" : "Check!"}
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          size="lg"
          className="h-14 text-lg"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
