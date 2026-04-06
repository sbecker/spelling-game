"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ListenAndType } from "@/components/exercises/listen-and-type";
import { Unscramble } from "@/components/exercises/unscramble";
import { FillInTheBlanks } from "@/components/exercises/fill-in-the-blanks";
import { MultipleChoice } from "@/components/exercises/multiple-choice";
import { FlashMemory } from "@/components/exercises/flash-memory";
import { GameFeedback } from "@/components/game-feedback";
import { LEVEL_THRESHOLDS } from "@/lib/gamification";

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
  xpGained?: number;
  streak?: number;
  levelUp?: number;
  newBadges?: string[];
}

interface GameProfile {
  totalXp: number;
  level: number;
  currentStreak: number;
  dailyStreak: number;
  earnedBadges: string[];
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
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [xpAnimation, setXpAnimation] = useState<number | null>(null);
  const [levelUpAnimation, setLevelUpAnimation] = useState<number | null>(null);
  const [badgeAnimation, setBadgeAnimation] = useState<string[] | null>(null);

  useEffect(() => {
    fetch("/api/game/profile")
      .then((r) => r.json())
      .then(setProfile);
  }, []);

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
    } else if (!result.canRetry) {
      setScore((s) => ({ ...s, total: s.total + 1 }));
    } else {
      setAttemptNumber(2);
    }

    // Handle gamification animations
    if (result.xpGained && result.xpGained > 0) {
      setXpAnimation(result.xpGained);
      setProfile((p) =>
        p ? { ...p, totalXp: p.totalXp + result.xpGained!, currentStreak: result.streak ?? 0 } : p
      );
      setTimeout(() => setXpAnimation(null), 2000);
    }

    if (result.streak !== undefined) {
      setProfile((p) => (p ? { ...p, currentStreak: result.streak! } : p));
    }

    if (result.levelUp) {
      setLevelUpAnimation(result.levelUp);
      setProfile((p) => (p ? { ...p, level: result.levelUp! } : p));
      setTimeout(() => setLevelUpAnimation(null), 3000);
    }

    if (result.newBadges && result.newBadges.length > 0) {
      setBadgeAnimation(result.newBadges);
      setTimeout(() => setBadgeAnimation(null), 3000);
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

  const xpForNextLevel = profile
    ? LEVEL_THRESHOLDS[profile.level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
    : 0;
  const xpProgress = profile
    ? Math.min(100, (profile.totalXp / xpForNextLevel) * 100)
    : 0;

  return (
    <div className="flex min-h-screen flex-col bg-blue-50">
      {/* Header bar */}
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-gray-600">
            Score: {score.correct}/{score.total}
          </div>
          {profile && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                Lv.{profile.level}
              </span>
              <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{profile.totalXp} XP</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {profile && profile.currentStreak > 0 && (
            <span className="text-sm font-bold text-orange-500">
              {profile.currentStreak} streak!
            </span>
          )}
        </div>
      </header>

      {/* XP animation */}
      {xpAnimation && (
        <div className="fixed top-16 right-4 z-50 animate-bounce rounded-lg bg-yellow-400 px-3 py-1 text-sm font-bold text-yellow-900 shadow-lg">
          +{xpAnimation} XP
        </div>
      )}

      {/* Level up animation */}
      {levelUpAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="animate-bounce rounded-2xl bg-white p-8 text-center shadow-2xl">
            <div className="text-4xl font-bold text-blue-600">LEVEL UP!</div>
            <div className="mt-2 text-6xl font-black text-yellow-500">
              {levelUpAnimation}
            </div>
            <p className="mt-2 text-gray-500">Keep going, trainer!</p>
          </div>
        </div>
      )}

      {/* Badge animation */}
      {badgeAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="animate-bounce rounded-2xl bg-white p-8 text-center shadow-2xl">
            <div className="text-3xl font-bold text-purple-600">
              Badge Earned!
            </div>
            {badgeAnimation.map((badge) => (
              <div key={badge} className="mt-2 text-xl font-semibold text-gray-700">
                {formatBadgeName(badge)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main game area */}
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-xl">
          {feedback && !feedback.canRetry ? (
            <GameFeedback result={feedback} onNext={handleNext} />
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

function formatBadgeName(badge: string): string {
  const names: Record<string, string> = {
    "master-10": "Word Master (10 words)",
    "master-25": "Word Champion (25 words)",
    "master-50": "Word Legend (50 words)",
    "streak-7": "Week Warrior (7-day streak)",
    "streak-30": "Month Master (30-day streak)",
    "perfect-session": "Perfect Session",
    "complete-list": "List Complete",
  };
  return names[badge] || badge;
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
