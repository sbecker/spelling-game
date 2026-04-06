import { describe, it, expect } from "vitest";
import {
  calculateXp,
  checkLevelUp,
  updateStreak,
  checkBadges,
  LEVEL_THRESHOLDS,
  type GameState,
  type BadgeId,
} from "./gamification";

describe("calculateXp", () => {
  it("awards base XP plus first-try bonus for first-attempt correct", () => {
    expect(calculateXp(true, 1, 0)).toBe(15); // 10 base + 5 first-try bonus
  });

  it("awards only base XP for second-attempt correct", () => {
    expect(calculateXp(true, 2, 0)).toBe(10);
  });

  it("awards bonus XP for first-try correct", () => {
    const firstTry = calculateXp(true, 1, 0);
    const secondTry = calculateXp(true, 2, 0);
    expect(firstTry).toBeGreaterThan(secondTry);
  });

  it("awards streak bonus XP", () => {
    const noStreak = calculateXp(true, 1, 0);
    const withStreak = calculateXp(true, 1, 5);
    expect(withStreak).toBeGreaterThan(noStreak);
  });

  it("awards 0 XP for incorrect answer", () => {
    expect(calculateXp(false, 1, 0)).toBe(0);
  });
});

describe("checkLevelUp", () => {
  it("returns level 1 for 0 XP", () => {
    expect(checkLevelUp(0)).toEqual({ level: 1, leveledUp: false });
  });

  it("returns level 2 when crossing first threshold", () => {
    const result = checkLevelUp(LEVEL_THRESHOLDS[1]);
    expect(result.level).toBe(2);
  });

  it("detects level up when previous XP was below threshold", () => {
    const threshold = LEVEL_THRESHOLDS[1];
    const result = checkLevelUp(threshold, threshold - 1);
    expect(result.leveledUp).toBe(true);
  });

  it("does not flag level up when staying at same level", () => {
    const result = checkLevelUp(15, 10);
    expect(result.leveledUp).toBe(false);
  });
});

describe("updateStreak", () => {
  it("increments streak on correct answer", () => {
    expect(updateStreak(3, true)).toBe(4);
  });

  it("resets streak on incorrect answer", () => {
    expect(updateStreak(5, false)).toBe(0);
  });

  it("starts streak from 0", () => {
    expect(updateStreak(0, true)).toBe(1);
  });
});

describe("checkBadges", () => {
  const baseState: GameState = {
    totalXp: 0,
    level: 1,
    currentStreak: 0,
    dailyStreak: 0,
    masteredWordCount: 0,
    perfectSessions: 0,
    completedLists: 0,
    earnedBadges: [],
  };

  it("awards master-10 badge when mastering 10 words", () => {
    const state = { ...baseState, masteredWordCount: 10 };
    const badges = checkBadges(state);
    expect(badges).toContain("master-10" as BadgeId);
  });

  it("awards master-25 badge when mastering 25 words", () => {
    const state = { ...baseState, masteredWordCount: 25 };
    const badges = checkBadges(state);
    expect(badges).toContain("master-25" as BadgeId);
  });

  it("awards streak-7 badge at 7-day daily streak", () => {
    const state = { ...baseState, dailyStreak: 7 };
    const badges = checkBadges(state);
    expect(badges).toContain("streak-7" as BadgeId);
  });

  it("awards perfect-session badge", () => {
    const state = { ...baseState, perfectSessions: 1 };
    const badges = checkBadges(state);
    expect(badges).toContain("perfect-session" as BadgeId);
  });

  it("does not re-award already earned badges", () => {
    const state: GameState = {
      ...baseState,
      masteredWordCount: 10,
      earnedBadges: ["master-10"],
    };
    const badges = checkBadges(state);
    expect(badges).not.toContain("master-10" as BadgeId);
  });

  it("returns empty array when no new badges earned", () => {
    const badges = checkBadges(baseState);
    expect(badges).toEqual([]);
  });
});
