export interface ProgressState {
  correctCount: number;
  incorrectCount: number;
  easeFactor: number;
  interval: number;
  nextReviewAt: Date | null;
}

export function calculateNextReview(
  state: ProgressState,
  correct: boolean
): ProgressState {
  let { correctCount, incorrectCount, easeFactor, interval } = state;

  if (correct) {
    correctCount++;

    // SM-2 interval calculation
    if (correctCount === 1) {
      interval = 1;
    } else if (correctCount === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }

    // Increase ease factor on correct answer
    easeFactor = easeFactor + 0.1;
  } else {
    incorrectCount++;
    interval = 1;

    // Decrease ease factor on incorrect answer
    easeFactor = easeFactor - 0.2;
  }

  // Clamp ease factor to minimum 1.3
  easeFactor = Math.max(1.3, easeFactor);

  const nextReviewAt = new Date(
    Date.now() + interval * 24 * 60 * 60 * 1000
  );

  return {
    correctCount,
    incorrectCount,
    easeFactor,
    interval,
    nextReviewAt,
  };
}

export function getMasteryTier(
  easeFactor: number,
  correctCount: number
): 1 | 2 | 3 {
  if (correctCount === 0 || easeFactor < 1.8) {
    return 1;
  }
  if (correctCount >= 5 && easeFactor >= 2.3) {
    return 3;
  }
  return 2;
}

interface DueWord {
  wordId: string;
  nextReviewAt: Date | null;
  easeFactor: number;
  interval: number;
}

export function selectDueWords(words: DueWord[]): DueWord[] {
  const now = Date.now();

  const due = words.filter(
    (w) => w.nextReviewAt === null || w.nextReviewAt.getTime() <= now
  );

  // Sort: new words first (null nextReviewAt), then most overdue
  due.sort((a, b) => {
    if (a.nextReviewAt === null && b.nextReviewAt !== null) return -1;
    if (a.nextReviewAt !== null && b.nextReviewAt === null) return 1;
    if (a.nextReviewAt === null && b.nextReviewAt === null) return 0;
    return a.nextReviewAt!.getTime() - b.nextReviewAt!.getTime();
  });

  return due;
}
