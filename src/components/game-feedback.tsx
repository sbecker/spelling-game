"use client";

import { Button } from "@/components/ui/button";

interface AnswerResult {
  correct: boolean;
  correctAnswer: string;
  hint?: string;
  canRetry: boolean;
  diff?: { letter: string; status: "correct" | "wrong" | "missing" }[];
}

interface Props {
  result: AnswerResult;
  onNext: () => void;
}

export function GameFeedback({ result, onNext }: Props) {
  return (
    <div className="space-y-6 text-center">
      {result.correct ? (
        <>
          <div className="text-4xl font-bold text-green-600">
            Super effective!
          </div>
          <p className="text-lg text-gray-600">You caught the spelling!</p>
          <div className="rounded-2xl bg-green-50 p-6">
            <span className="text-3xl font-bold text-green-700">
              {result.correctAnswer}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="text-3xl font-bold text-orange-500">
            The word got away...
          </div>
          <p className="text-lg text-gray-600">
            The correct spelling is:
          </p>
          {result.diff ? (
            <div className="rounded-2xl bg-white p-6 shadow">
              <div className="flex justify-center gap-1">
                {result.diff.map((d, i) => (
                  <span
                    key={i}
                    className={`inline-block text-3xl font-bold ${
                      d.status === "correct"
                        ? "text-green-600"
                        : d.status === "wrong"
                          ? "text-red-600 underline decoration-red-400"
                          : "text-blue-600"
                    }`}
                  >
                    {d.letter}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-orange-50 p-6">
              <span className="text-3xl font-bold text-orange-700">
                {result.correctAnswer}
              </span>
            </div>
          )}
        </>
      )}

      <Button onClick={onNext} size="lg" className="h-14 text-lg w-full">
        Next Word!
      </Button>
    </div>
  );
}
