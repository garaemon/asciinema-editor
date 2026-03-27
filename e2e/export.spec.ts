import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sampleCastPath = path.resolve(currentDir, "fixtures/sample.cast");

async function uploadFile(page: import("@playwright/test").Page) {
  const fileInput = page.getByTestId("file-input");
  await fileInput.setInputFiles(sampleCastPath);
  await expect(page.getByRole("button", { name: "Export" })).toBeVisible();
}

async function navigateToExportScreen(page: import("@playwright/test").Page) {
  await uploadFile(page);
  await page.getByRole("button", { name: "Export" }).click();
  await expect(page.getByRole("heading", { name: "Export" })).toBeVisible();
}

test.describe("Export Screen", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows download buttons", async ({ page }) => {
    await navigateToExportScreen(page);

    await expect(page.getByRole("button", { name: "Download .cast" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Download Animated GIF" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Download MP4" })).toBeVisible();
  });

  test("shows player preview on export screen", async ({ page }) => {
    await navigateToExportScreen(page);

    await expect(page.getByTestId("player-container")).toBeAttached();
  });

  test("Download .cast triggers download", async ({ page }) => {
    await navigateToExportScreen(page);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download .cast" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("edited.cast");
  });

  test("shows correct frame estimate for default settings", async ({ page }) => {
    await navigateToExportScreen(page);

    // sample.cast is 2s long, default 10fps = ~20 frames
    await expect(page.getByText("~20 frames")).toBeVisible();
  });

  test("frame count updates when FPS slider changes", async ({ page }) => {
    await navigateToExportScreen(page);

    const fpsSlider = page.getByRole("slider", { name: /FPS/ });
    await fpsSlider.fill("5");

    // 2s * 5fps = ~10 frames
    await expect(page.getByText("~10 frames")).toBeVisible();
  });

  test("frame count is valid after speed change", async ({ page }) => {
    await uploadFile(page);

    // Apply 2x speed on editing screen
    await page.getByRole("spinbutton", { name: "Speed multiplier" }).fill("2");
    await page.getByRole("button", { name: "Apply" }).click();

    // Navigate to export
    await page.getByRole("button", { name: "Export" }).click();
    await expect(page.getByRole("heading", { name: "Export" })).toBeVisible();

    // 2s / 2x = 1s, 10fps = ~10 frames (must not be NaN)
    const frameEstimate = page.locator(".gif-frame-estimate");
    const text = await frameEstimate.textContent();
    expect(text).not.toContain("NaN");
    expect(text).toBe("~10 frames");
  });

  test("animated GIF downloads successfully", async ({ page }) => {
    await navigateToExportScreen(page);

    await page.getByTestId("player-container").waitFor({ state: "attached" });
    await page.waitForTimeout(1000);

    const gifButton = page.getByRole("button", { name: "Download Animated GIF" });
    await expect(gifButton).toBeEnabled();

    const downloadPromise = page.waitForEvent("download", { timeout: 60000 });
    await gifButton.click();

    // Verify progress indicator appears during export
    await expect(page.getByRole("button", { name: /Exporting GIF/ })).toBeVisible();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("recording.gif");

    // Verify the file is a valid GIF (starts with GIF89a header)
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const buffer = fs.readFileSync(filePath!);
    expect(buffer.length).toBeGreaterThan(100);
    expect(buffer.subarray(0, 6).toString()).toBe("GIF89a");
  });

  test("animated GIF works after speed and font changes", async ({ page }) => {
    await uploadFile(page);

    // Apply 2x speed
    await page.getByRole("spinbutton", { name: "Speed multiplier" }).fill("2");
    await page.getByRole("button", { name: "Apply" }).click();

    // Change font
    await page.getByRole("combobox").selectOption("Fira Code");

    // Navigate to export
    await page.getByRole("button", { name: "Export" }).click();
    await expect(page.getByRole("heading", { name: "Export" })).toBeVisible();
    await page.getByTestId("player-container").waitFor({ state: "attached" });
    await page.waitForTimeout(1000);

    // Verify frame count is valid
    const frameEstimate = page.locator(".gif-frame-estimate");
    const text = await frameEstimate.textContent();
    expect(text).not.toContain("NaN");

    // Export GIF and verify download
    const downloadPromise = page.waitForEvent("download", { timeout: 60000 });
    await page.getByRole("button", { name: "Download Animated GIF" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("recording.gif");
    const filePath = await download.path();
    const buffer = fs.readFileSync(filePath!);
    expect(buffer.subarray(0, 6).toString()).toBe("GIF89a");
  });
});
