import { describe, it, expect } from "vitest";
import {
  selectExerciseType,
  generateScrambledLetters,
  generateBlanks,
  generateMisspellings,
  type ExerciseType,
} from "./exercise-engine";

describe("selectExerciseType", () => {
  it("returns tier 1 exercises for tier 1 words", () => {
    const types = new Set<ExerciseType>();
    for (let i = 0; i < 50; i++) {
      types.add(selectExerciseType(1));
    }
    expect(types.has("multiple_choice")).toBe(true);
    expect(types.has("fill_in_the_blanks")).toBe(true);
    expect(types.has("listen_and_type")).toBe(false);
    expect(types.has("unscramble")).toBe(false);
    expect(types.has("flash_memory")).toBe(false);
  });

  it("returns tier 2 exercises for tier 2 words", () => {
    const types = new Set<ExerciseType>();
    for (let i = 0; i < 50; i++) {
      types.add(selectExerciseType(2));
    }
    expect(types.has("unscramble")).toBe(true);
    expect(types.has("flash_memory")).toBe(true);
    expect(types.has("listen_and_type")).toBe(false);
  });

  it("returns listen_and_type for tier 3 words", () => {
    expect(selectExerciseType(3)).toBe("listen_and_type");
  });
});

describe("generateScrambledLetters", () => {
  it("returns all letters from the word", () => {
    const letters = generateScrambledLetters("hello");
    expect(letters.sort()).toEqual(["e", "h", "l", "l", "o"]);
  });

  it("returns scrambled order (not always identical to input)", () => {
    // Run multiple times to check it scrambles at least once
    let scrambled = false;
    for (let i = 0; i < 20; i++) {
      const letters = generateScrambledLetters("spelling");
      if (letters.join("") !== "spelling") {
        scrambled = true;
        break;
      }
    }
    expect(scrambled).toBe(true);
  });

  it("handles short words", () => {
    const letters = generateScrambledLetters("at");
    expect(letters.sort()).toEqual(["a", "t"]);
  });
});

describe("generateBlanks", () => {
  it("returns the word with some letters replaced by blanks", () => {
    const result = generateBlanks("spelling");
    expect(result.display.length).toBe("spelling".length);
    expect(result.display).toContain("_");
    expect(result.blanks.length).toBeGreaterThan(0);
    expect(result.blanks.length).toBeLessThanOrEqual(3);
  });

  it("each blank has correct position and letter", () => {
    const result = generateBlanks("cat");
    for (const blank of result.blanks) {
      expect("cat"[blank.position]).toBe(blank.letter);
      expect(result.display[blank.position]).toBe("_");
    }
  });

  it("provides distractor options that include the correct letter", () => {
    const result = generateBlanks("hello");
    for (const blank of result.blanks) {
      expect(blank.options).toContain(blank.letter);
      expect(blank.options.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("generateMisspellings", () => {
  it("returns exactly 3 misspellings", () => {
    const misspellings = generateMisspellings("thought");
    expect(misspellings).toHaveLength(3);
  });

  it("all misspellings are different from the correct word", () => {
    const word = "because";
    const misspellings = generateMisspellings(word);
    for (const m of misspellings) {
      expect(m).not.toBe(word);
    }
  });

  it("all misspellings are unique", () => {
    const misspellings = generateMisspellings("beautiful");
    const unique = new Set(misspellings);
    expect(unique.size).toBe(misspellings.length);
  });

  it("misspellings are plausible (similar length)", () => {
    const word = "friend";
    const misspellings = generateMisspellings(word);
    for (const m of misspellings) {
      expect(Math.abs(m.length - word.length)).toBeLessThanOrEqual(2);
    }
  });
});
