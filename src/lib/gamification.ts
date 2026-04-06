export type BadgeId =
  | "master-10"
  | "master-25"
  | "master-50"
  | "streak-7"
  | "streak-30"
  | "perfect-session"
  | "complete-list";

export interface GameState {
  totalXp: number;
  level: number;
  currentStreak: number;
  dailyStreak: number;
  masteredWordCount: number;
  perfectSessions: number;
  completedLists: number;
  earnedBadges: BadgeId[];
}

// XP needed to reach each level (index = level number)
export const LEVEL_THRESHOLDS = [
  0,    // level 1: 0 XP
  50,   // level 2: 50 XP
  150,  // level 3: 150 XP
  300,  // level 4: 300 XP
  500,  // level 5: 500 XP
  750,  // level 6: 750 XP
  1050, // level 7: 1050 XP
  1400, // level 8: 1400 XP
  1800, // level 9: 1800 XP
  2250, // level 10: 2250 XP
];

const BASE_XP = 10;
const FIRST_TRY_BONUS = 5;
const STREAK_BONUS_PER = 1;
const MAX_STREAK_BONUS = 10;

export function calculateXp(
  correct: boolean,
  attemptNumber: number,
  currentStreak: number
): number {
  if (!correct) return 0;

  let xp = BASE_XP;

  // First-try bonus
  if (attemptNumber === 1) {
    xp += FIRST_TRY_BONUS;
  }

  // Streak bonus (capped)
  xp += Math.min(currentStreak * STREAK_BONUS_PER, MAX_STREAK_BONUS);

  return xp;
}

export function checkLevelUp(
  totalXp: number,
  previousXp?: number
): { level: number; leveledUp: boolean } {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }

  let leveledUp = false;
  if (previousXp !== undefined) {
    let prevLevel = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (previousXp >= LEVEL_THRESHOLDS[i]) {
        prevLevel = i + 1;
        break;
      }
    }
    leveledUp = level > prevLevel;
  }

  return { level, leveledUp };
}

export function updateStreak(currentStreak: number, correct: boolean): number {
  return correct ? currentStreak + 1 : 0;
}

interface BadgeCondition {
  id: BadgeId;
  check: (state: GameState) => boolean;
}

const BADGE_CONDITIONS: BadgeCondition[] = [
  { id: "master-10", check: (s) => s.masteredWordCount >= 10 },
  { id: "master-25", check: (s) => s.masteredWordCount >= 25 },
  { id: "master-50", check: (s) => s.masteredWordCount >= 50 },
  { id: "streak-7", check: (s) => s.dailyStreak >= 7 },
  { id: "streak-30", check: (s) => s.dailyStreak >= 30 },
  { id: "perfect-session", check: (s) => s.perfectSessions >= 1 },
  { id: "complete-list", check: (s) => s.completedLists >= 1 },
];

export function checkBadges(state: GameState): BadgeId[] {
  return BADGE_CONDITIONS.filter(
    (b) => !state.earnedBadges.includes(b.id) && b.check(state)
  ).map((b) => b.id);
}
