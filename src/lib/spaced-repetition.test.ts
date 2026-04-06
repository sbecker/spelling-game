import { describe, it, expect } from "vitest";
import {
  calculateNextReview,
  selectDueWords,
  getMasteryTier,
  type ProgressState,
} from "./spaced-repetition";

describe("calculateNextReview", () => {
  const defaultState: ProgressState = {
    correctCount: 0,
    incorrectCount: 0,
    easeFactor: 2.5,
    interval: 0,
    nextReviewAt: null,
  };

  it("sets interval to 1 day on first correct answer", () => {
    const result = calculateNextReview(defaultState, true);
    expect(result.interval).toBe(1);
    expect(result.correctCount).toBe(1);
    expect(result.incorrectCount).toBe(0);
  });

  it("sets interval to 6 days on second correct answer", () => {
    const state: ProgressState = {
      ...defaultState,
      correctCount: 1,
      interval: 1,
    };
    const result = calculateNextReview(state, true);
    expect(result.interval).toBe(6);
  });

  it("multiplies interval by ease factor on subsequent correct answers", () => {
    const state: ProgressState = {
      ...defaultState,
      correctCount: 2,
      interval: 6,
      easeFactor: 2.5,
    };
    const result = calculateNextReview(state, true);
    expect(result.interval).toBe(15); // 6 * 2.5 = 15
  });

  it("resets interval to 1 on incorrect answer", () => {
    const state: ProgressState = {
      ...defaultState,
      correctCount: 5,
      interval: 30,
      easeFactor: 2.5,
    };
    const result = calculateNextReview(state, false);
    expect(result.interval).toBe(1);
    expect(result.incorrectCount).toBe(1);
  });

  it("decreases ease factor on incorrect answer (minimum 1.3)", () => {
    const state: ProgressState = {
      ...defaultState,
      easeFactor: 2.5,
    };
    const result = calculateNextReview(state, false);
    expect(result.easeFactor).toBeLessThan(2.5);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("increases ease factor on correct answer", () => {
    const state: ProgressState = {
      ...defaultState,
      easeFactor: 2.0,
      correctCount: 2,
      interval: 6,
    };
    const result = calculateNextReview(state, true);
    expect(result.easeFactor).toBeGreaterThan(2.0);
  });

  it("never drops ease factor below 1.3", () => {
    let state: ProgressState = { ...defaultState, easeFactor: 1.3 };
    for (let i = 0; i < 10; i++) {
      state = calculateNextReview(state, false);
    }
    expect(state.easeFactor).toBe(1.3);
  });

  it("sets nextReviewAt based on interval", () => {
    const result = calculateNextReview(defaultState, true);
    expect(result.nextReviewAt).toBeInstanceOf(Date);
    const diffMs =
      result.nextReviewAt!.getTime() - Date.now();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(0.9);
    expect(diffDays).toBeLessThan(1.1);
  });
});

describe("getMasteryTier", () => {
  it("returns tier 1 for new words (ease >= 2.5, no history)", () => {
    expect(getMasteryTier(2.5, 0)).toBe(1);
  });

  it("returns tier 1 for struggling words (low ease factor)", () => {
    expect(getMasteryTier(1.5, 3)).toBe(1);
  });

  it("returns tier 2 for learning words", () => {
    expect(getMasteryTier(2.0, 3)).toBe(2);
  });

  it("returns tier 3 for nearly mastered words", () => {
    expect(getMasteryTier(2.5, 6)).toBe(3);
  });
});

describe("selectDueWords", () => {
  it("returns words that are due for review", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 1000 * 60 * 60);
    const future = new Date(now.getTime() + 1000 * 60 * 60 * 24);

    const words = [
      { wordId: "a", nextReviewAt: past, easeFactor: 2.5, interval: 1 },
      { wordId: "b", nextReviewAt: future, easeFactor: 2.5, interval: 1 },
      { wordId: "c", nextReviewAt: null, easeFactor: 2.5, interval: 0 },
    ];

    const due = selectDueWords(words);
    expect(due.map((w) => w.wordId)).toEqual(["c", "a"]);
  });

  it("prioritizes new words (null nextReviewAt) first", () => {
    const past = new Date(Date.now() - 1000);
    const words = [
      { wordId: "a", nextReviewAt: past, easeFactor: 2.5, interval: 1 },
      { wordId: "b", nextReviewAt: null, easeFactor: 2.5, interval: 0 },
    ];

    const due = selectDueWords(words);
    expect(due[0].wordId).toBe("b");
  });

  it("prioritizes overdue words by how overdue they are", () => {
    const now = Date.now();
    const words = [
      {
        wordId: "a",
        nextReviewAt: new Date(now - 1000 * 60 * 60),
        easeFactor: 2.5,
        interval: 1,
      },
      {
        wordId: "b",
        nextReviewAt: new Date(now - 1000 * 60 * 60 * 24),
        easeFactor: 2.5,
        interval: 1,
      },
    ];

    const due = selectDueWords(words);
    expect(due[0].wordId).toBe("b");
  });
});
