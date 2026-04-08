import { describe, it, expect } from "vitest";
import { stripAnsi } from "../ansi";

describe("stripAnsi", () => {
  it("returns plain text unchanged", () => {
    expect(stripAnsi("hello world")).toBe("hello world");
  });

  it("strips SGR color codes", () => {
    expect(stripAnsi("\x1b[31mred text\x1b[0m")).toBe("red text");
  });

  it("strips bold and underline codes", () => {
    expect(stripAnsi("\x1b[1mbold\x1b[22m \x1b[4munderline\x1b[24m")).toBe(
      "bold underline"
    );
  });

  it("strips cursor movement sequences", () => {
    expect(stripAnsi("\x1b[2Jhello\x1b[H")).toBe("hello");
  });

  it("strips multiple ANSI codes in sequence", () => {
    expect(stripAnsi("\x1b[1;32mgreen bold\x1b[0m normal")).toBe(
      "green bold normal"
    );
  });

  it("handles empty string", () => {
    expect(stripAnsi("")).toBe("");
  });

  it("strips OSC sequences (title set)", () => {
    expect(stripAnsi("\x1b]0;title\x07rest")).toBe("rest");
  });
});
