"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ListenAndType } from "@/components/exercises/listen-and-type";
import { Unscramble } from "@/components/exercises/unscramble";
import { FillInTheBlanks } from "@/components/exercises/fill-in-the-blanks";
import { MultipleChoice } from "@/components/exercises/multiple-choice";
import { FlashMemory } from "@/components/exercises/flash-memory";
import { GameFeedback } from "@/components/game-feedback";

interface Exercise {
  wordId: string;
  word?: string;
  exerciseType: string;
  tier: number;
  scrambledLetters?: string[];
  blanks?: {
    display: string[];
    blanks: { position: number; letter: string; options: string[] }[];
  };
  options?: string[];
  wordLength?: number;
  displayTime?: number;
}

interface AnswerResult {
  correct: boolean;
  correctAnswer: string;
  hint?: string;
  canRetry: boolean;
  diff?: { letter: string; status: "correct" | "wrong" | "missing" }[];
}

export default function PlayPage() {
  const searchParams = useSearchParams();
  const wordListId = searchParams.get("list");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  const startSession = useCallback(async () => {
    const res = await fetch("/api/game/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordListId }),
    });
    const data = await res.json();
    setSessionId(data.id);
    return data.id;
  }, [wordListId]);

  const fetchExercise = useCallback(
    async (sid: string) => {
      setLoading(true);
      setFeedback(null);
      setAttemptNumber(1);
      const params = new URLSearchParams({ sessionId: sid });
      if (wordListId) params.set("wordListId", wordListId);
      const res = await fetch(`/api/game/session?${params}`);
      if (res.ok) {
        const data = await res.json();
        setExercise(data);
      }
      setLoading(false);
    },
    [wordListId]
  );

  useEffect(() => {
    startSession().then((sid) => fetchExercise(sid));
  }, [startSession, fetchExercise]);

  async function submitAnswer(answer: string) {
    if (!sessionId || !exercise) return;

    const res = await fetch("/api/game/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        wordId: exercise.wordId,
        exerciseType: exercise.exerciseType,
        answer,
        attemptNumber,
      }),
    });

    const result: AnswerResult = await res.json();
    setFeedback(result);

    if (result.correct) {
      setScore((s) => ({ correct: s.correct + 1, total: s.total + 1 }));
      setStreak((s) => s + 1);
    } else if (!result.canRetry) {
      setScore((s) => ({ ...s, total: s.total + 1 }));
      setStreak(0);
    } else {
      setAttemptNumber(2);
    }
  }

  function handleNext() {
    if (sessionId) fetchExercise(sessionId);
  }

  if (loading && !exercise) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-blue-50">
        <p className="text-lg text-gray-600">Loading adventure...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-blue-50">
      {/* Header bar */}
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="text-sm font-medium text-gray-600">
          Score: {score.correct}/{score.total}
        </div>
        <div className="text-sm font-bold text-orange-500">
          {streak > 0 ? `${streak} streak!` : ""}
        </div>
      </header>

      {/* Main game area */}
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-xl">
          {feedback && (!feedback.canRetry || !feedback.correct) && !feedback.canRetry ? (
            <GameFeedback
              result={feedback}
              onNext={handleNext}
            />
          ) : exercise ? (
            <ExerciseRenderer
              exercise={exercise}
              onSubmit={submitAnswer}
              feedback={feedback}
              attemptNumber={attemptNumber}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}

function ExerciseRenderer({
  exercise,
  onSubmit,
  feedback,
  attemptNumber,
}: {
  exercise: Exercise;
  onSubmit: (answer: string) => void;
  feedback: AnswerResult | null;
  attemptNumber: number;
}) {
  const hint = feedback?.canRetry ? feedback.hint : undefined;

  switch (exercise.exerciseType) {
    case "listen_and_type":
      return (
        <ListenAndType
          wordId={exercise.wordId}
          onSubmit={onSubmit}
          hint={hint}
          attemptNumber={attemptNumber}
        />
      );
    case "unscramble":
      return (
        <Unscramble
          letters={exercise.scrambledLetters!}
          onSubmit={onSubmit}
          hint={hint}
          attemptNumber={attemptNumber}
        />
      );
    case "fill_in_the_blanks":
      return (
        <FillInTheBlanks
          blanks={exercise.blanks!}
          onSubmit={onSubmit}
          hint={hint}
          attemptNumber={attemptNumber}
        />
      );
    case "multiple_choice":
      return (
        <MultipleChoice
          options={exercise.options!}
          wordId={exercise.wordId}
          onSubmit={onSubmit}
          hint={hint}
          attemptNumber={attemptNumber}
        />
      );
    case "flash_memory":
      return (
        <FlashMemory
          word={exercise.word!}
          displayTime={exercise.displayTime!}
          onSubmit={onSubmit}
          hint={hint}
          attemptNumber={attemptNumber}
        />
      );
    default:
      return <div>Unknown exercise type</div>;
  }
}
