export type ExerciseType =
  | "listen_and_type"
  | "unscramble"
  | "fill_in_the_blanks"
  | "multiple_choice"
  | "flash_memory";

const TIER_EXERCISES: Record<1 | 2 | 3, ExerciseType[]> = {
  1: ["multiple_choice", "fill_in_the_blanks"],
  2: ["unscramble", "flash_memory"],
  3: ["listen_and_type"],
};

export function selectExerciseType(tier: 1 | 2 | 3): ExerciseType {
  const options = TIER_EXERCISES[tier];
  return options[Math.floor(Math.random() * options.length)];
}

export function generateScrambledLetters(word: string): string[] {
  const letters = word.split("");
  // Fisher-Yates shuffle
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters;
}

interface BlankInfo {
  position: number;
  letter: string;
  options: string[];
}

export interface BlanksResult {
  display: string[];
  blanks: BlankInfo[];
}

const VOWELS = "aeiou";
const CONSONANTS = "bcdfghjklmnpqrstvwxyz";

export function generateBlanks(word: string): BlanksResult {
  const letters = word.split("");
  const numBlanks = Math.min(3, Math.max(1, Math.ceil(word.length / 3)));

  // Pick random positions for blanks
  const positions: number[] = [];
  const available = letters.map((_, i) => i);
  for (let i = 0; i < numBlanks && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    positions.push(available[idx]);
    available.splice(idx, 1);
  }
  positions.sort((a, b) => a - b);

  const display = [...letters];
  const blanks: BlankInfo[] = positions.map((pos) => {
    display[pos] = "_";
    const letter = letters[pos];
    const options = generateLetterOptions(letter);
    return { position: pos, letter, options };
  });

  return { display, blanks };
}

function generateLetterOptions(correct: string): string[] {
  const isVowel = VOWELS.includes(correct);
  const pool = isVowel ? VOWELS : CONSONANTS;
  const options = new Set<string>([correct]);

  while (options.size < Math.min(4, pool.length)) {
    const letter = pool[Math.floor(Math.random() * pool.length)];
    options.add(letter);
  }

  // Shuffle
  return [...options].sort(() => Math.random() - 0.5);
}

// Common misspelling rules
const VOWEL_SWAPS: Record<string, string[]> = {
  a: ["e", "u"],
  e: ["a", "i"],
  i: ["e", "y"],
  o: ["u", "a"],
  u: ["o", "a"],
};

const DOUBLE_CONSONANTS = ["l", "s", "t", "r", "n", "m", "p", "f", "g"];

export function generateMisspellings(word: string): string[] {
  const misspellings = new Set<string>();
  const letters = word.split("");

  // Strategy 1: Swap vowels
  for (let i = 0; i < letters.length && misspellings.size < 3; i++) {
    const swaps = VOWEL_SWAPS[letters[i]];
    if (swaps) {
      for (const swap of swaps) {
        const variant = [...letters];
        variant[i] = swap;
        const result = variant.join("");
        if (result !== word && !misspellings.has(result)) {
          misspellings.add(result);
          break;
        }
      }
    }
  }

  // Strategy 2: Double/un-double consonants
  for (let i = 0; i < letters.length - 1 && misspellings.size < 3; i++) {
    if (letters[i] === letters[i + 1] && DOUBLE_CONSONANTS.includes(letters[i])) {
      // Remove the double
      const variant = [...letters];
      variant.splice(i, 1);
      const result = variant.join("");
      if (result !== word) misspellings.add(result);
    } else if (DOUBLE_CONSONANTS.includes(letters[i])) {
      // Add a double
      const variant = [...letters];
      variant.splice(i + 1, 0, letters[i]);
      const result = variant.join("");
      if (result !== word) misspellings.add(result);
    }
  }

  // Strategy 3: Swap adjacent letters
  for (let i = 0; i < letters.length - 1 && misspellings.size < 3; i++) {
    if (letters[i] !== letters[i + 1]) {
      const variant = [...letters];
      [variant[i], variant[i + 1]] = [variant[i + 1], variant[i]];
      const result = variant.join("");
      if (result !== word) misspellings.add(result);
    }
  }

  // Strategy 4: Drop a letter
  for (let i = 0; i < letters.length && misspellings.size < 3; i++) {
    const variant = [...letters];
    variant.splice(i, 1);
    const result = variant.join("");
    if (result !== word && !misspellings.has(result)) {
      misspellings.add(result);
    }
  }

  // Ensure we have exactly 3 (pad with simple mutations if needed)
  let attempt = 0;
  while (misspellings.size < 3 && attempt < 20) {
    const i = Math.floor(Math.random() * letters.length);
    const variant = [...letters];
    const pool = VOWELS.includes(letters[i]) ? VOWELS : CONSONANTS;
    variant[i] = pool[Math.floor(Math.random() * pool.length)];
    const result = variant.join("");
    if (result !== word) misspellings.add(result);
    attempt++;
  }

  return [...misspellings].slice(0, 3);
}
