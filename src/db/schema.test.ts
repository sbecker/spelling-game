import { describe, it, expect } from "vitest";
import { users, wordLists, words, progress, sessions, sessionResults } from "./schema";

describe("database schema", () => {
  it("exports all tables", () => {
    expect(users).toBeDefined();
    expect(wordLists).toBeDefined();
    expect(words).toBeDefined();
    expect(progress).toBeDefined();
    expect(sessions).toBeDefined();
    expect(sessionResults).toBeDefined();
  });
});
