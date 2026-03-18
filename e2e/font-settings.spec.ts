import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sampleCastPath = path.resolve(currentDir, "fixtures/sample.cast");

async function uploadAndWaitForPlayer(page: import("@playwright/test").Page) {
  const fileInput = page.getByTestId("file-input");
  await fileInput.setInputFiles(sampleCastPath);
  await expect(page.getByTestId("player-container")).toBeAttached();
  // Wait for player to render terminal content
  await expect(page.locator(".ap-term")).toBeVisible();
}

function getTerminalFontFamily(page: import("@playwright/test").Page) {
  return page.locator(".ap-term").evaluate((el) => {
    return window.getComputedStyle(el).fontFamily;
  });
}

test.describe("Font Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await uploadAndWaitForPlayer(page);
  });

  test("shows font family dropdown in sidebar", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Font" })).toBeVisible();
    const fontSelect = page.locator(".font-select");
    await expect(fontSelect).toBeVisible();
    await expect(fontSelect).toHaveValue("");
  });

  test("changes player font when selecting a different font family", async ({ page }) => {
    const defaultFont = await getTerminalFontFamily(page);

    // Select Fira Code
    await page.locator(".font-select").selectOption("Fira Code");

    // Wait for player to re-create with new font
    await expect(page.locator(".ap-term")).toBeVisible();
    const newFont = await getTerminalFontFamily(page);

    // Font family should have changed to include Fira Code
    expect(newFont).not.toBe(defaultFont);
    expect(newFont).toContain("Fira Code");
  });

  test("switching between fonts updates player each time", async ({ page }) => {
    // Select JetBrains Mono
    await page.locator(".font-select").selectOption("JetBrains Mono");
    await expect(page.locator(".ap-term")).toBeVisible();
    const jetbrainsFont = await getTerminalFontFamily(page);
    expect(jetbrainsFont).toContain("JetBrains Mono");

    // Switch to Source Code Pro
    await page.locator(".font-select").selectOption("Source Code Pro");
    await expect(page.locator(".ap-term")).toBeVisible();
    const sourceCodeFont = await getTerminalFontFamily(page);
    expect(sourceCodeFont).toContain("Source Code Pro");
    expect(sourceCodeFont).not.toContain("JetBrains Mono");
  });

  test("switching back to Default restores original font", async ({ page }) => {
    const defaultFont = await getTerminalFontFamily(page);

    // Select a font then go back to Default
    await page.locator(".font-select").selectOption("Fira Code");
    await expect(page.locator(".ap-term")).toBeVisible();

    await page.locator(".font-select").selectOption("Default");
    await expect(page.locator(".ap-term")).toBeVisible();
    const restoredFont = await getTerminalFontFamily(page);

    expect(restoredFont).toBe(defaultFont);
  });
});
