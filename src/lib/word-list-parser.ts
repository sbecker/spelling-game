export function parseWordInput(input: string): string[] {
  return input
    .split(/[\n,]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0)
    .filter((w, i, arr) => arr.indexOf(w) === i);
}

export function parseCsv(csvContent: string): string[] {
  const lines = csvContent.split(/\r?\n/);
  const words: string[] = [];

  for (const line of lines) {
    // Each cell in each row could be a word
    const cells = line.split(",");
    for (const cell of cells) {
      const trimmed = cell.trim().toLowerCase().replace(/^"|"$/g, "");
      if (trimmed.length > 0 && /^[a-z'-]+$/.test(trimmed)) {
        words.push(trimmed);
      }
    }
  }

  return words.filter((w, i, arr) => arr.indexOf(w) === i);
}
