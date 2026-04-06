import { describe, it, expect } from "vitest";
import { parseWordInput, parseCsv } from "./word-list-parser";

describe("parseWordInput", () => {
  it("splits by newlines", () => {
    expect(parseWordInput("hello\nworld")).toEqual(["hello", "world"]);
  });

  it("splits by commas", () => {
    expect(parseWordInput("hello, world")).toEqual(["hello", "world"]);
  });

  it("handles mixed delimiters", () => {
    expect(parseWordInput("hello, world\nfoo\nbar, baz")).toEqual([
      "hello", "world", "foo", "bar", "baz",
    ]);
  });

  it("trims whitespace and lowercases", () => {
    expect(parseWordInput("  Hello \n  WORLD  ")).toEqual(["hello", "world"]);
  });

  it("removes duplicates", () => {
    expect(parseWordInput("hello, hello, world")).toEqual(["hello", "world"]);
  });

  it("filters empty strings", () => {
    expect(parseWordInput(",,,\n\n\n")).toEqual([]);
  });
});

describe("parseCsv", () => {
  it("parses simple csv", () => {
    expect(parseCsv("hello,world\nfoo,bar")).toEqual([
      "hello", "world", "foo", "bar",
    ]);
  });

  it("handles quoted values", () => {
    expect(parseCsv('"hello","world"')).toEqual(["hello", "world"]);
  });

  it("removes duplicates", () => {
    expect(parseCsv("hello,hello,world")).toEqual(["hello", "world"]);
  });

  it("filters non-word content", () => {
    expect(parseCsv("hello,123,world")).toEqual(["hello", "world"]);
  });

  it("handles words with apostrophes and hyphens", () => {
    expect(parseCsv("don't,well-known")).toEqual(["don't", "well-known"]);
  });
});
