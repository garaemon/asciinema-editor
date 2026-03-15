import { describe, it, expect, beforeEach } from "vitest";
import { loadFont, requiresLocalInstall } from "../font-loader";

describe("requiresLocalInstall", () => {
  it("returns false for empty string", () => {
    expect(requiresLocalInstall("")).toBe(false);
  });

  it("returns false for Google Fonts families", () => {
    expect(requiresLocalInstall("Fira Code")).toBe(false);
    expect(requiresLocalInstall("JetBrains Mono")).toBe(false);
    expect(requiresLocalInstall("Source Code Pro")).toBe(false);
    expect(requiresLocalInstall("IBM Plex Mono")).toBe(false);
    expect(requiresLocalInstall("Cascadia Code")).toBe(false);
  });

  it("returns true for Nerd Font families", () => {
    expect(requiresLocalInstall("Hack Nerd Font")).toBe(true);
    expect(requiresLocalInstall("FiraCode Nerd Font")).toBe(true);
    expect(requiresLocalInstall("JetBrainsMono Nerd Font")).toBe(true);
    expect(requiresLocalInstall("CascadiaCode Nerd Font")).toBe(true);
  });

  it("returns true for unknown font families", () => {
    expect(requiresLocalInstall("Comic Sans MS")).toBe(true);
  });
});

describe("loadFont", () => {
  beforeEach(() => {
    // Clear all <link> elements added by loadFont
    document.head.querySelectorAll("link[rel=stylesheet]").forEach((el) => el.remove());
  });

  it("adds a Google Fonts stylesheet link to document head", () => {
    loadFont("Fira Code");
    const expectedUrl = "https://fonts.googleapis.com/css2?family=Fira+Code&display=swap";
    const links = document.head.querySelectorAll("link[rel=stylesheet]");
    const fontLink = Array.from(links).find((l) =>
      l.getAttribute("href") === expectedUrl
    );
    expect(fontLink).toBeTruthy();
    expect(fontLink?.getAttribute("href")).toBe(expectedUrl);
  });

  it("does not add duplicate links for the same font", () => {
    loadFont("JetBrains Mono");
    loadFont("JetBrains Mono");
    const expectedUrl = "https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap";
    const links = Array.from(document.head.querySelectorAll("link[rel=stylesheet]")).filter((l) =>
      l.getAttribute("href") === expectedUrl
    );
    expect(links).toHaveLength(1);
  });

  it("does not add a link for empty font family", () => {
    const countBefore = document.head.querySelectorAll("link[rel=stylesheet]").length;
    loadFont("");
    const countAfter = document.head.querySelectorAll("link[rel=stylesheet]").length;
    expect(countAfter).toBe(countBefore);
  });

  it("does not add a link for Nerd Font families", () => {
    const countBefore = document.head.querySelectorAll("link[rel=stylesheet]").length;
    loadFont("Hack Nerd Font");
    const countAfter = document.head.querySelectorAll("link[rel=stylesheet]").length;
    expect(countAfter).toBe(countBefore);
  });

  it("uses correct Google Fonts URL mapping", () => {
    loadFont("Cascadia Code");
    // Cascadia Code maps to Cascadia+Mono on Google Fonts
    const expectedUrl = "https://fonts.googleapis.com/css2?family=Cascadia+Mono&display=swap";
    const link = Array.from(document.head.querySelectorAll("link[rel=stylesheet]")).find((l) =>
      l.getAttribute("href") === expectedUrl
    );
    expect(link).toBeTruthy();
  });
});
