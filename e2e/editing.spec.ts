import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sampleCastPath = path.resolve(currentDir, "fixtures/sample.cast");

async function uploadSampleFile(page: import("@playwright/test").Page) {
  await page.goto("/");
  const fileInput = page.getByTestId("file-input");
  await fileInput.setInputFiles(sampleCastPath);
  await expect(page.getByRole("heading", { name: "Speed" })).toBeVisible();
}

test.describe("Speed Controls", () => {
  test.beforeEach(async ({ page }) => {
    await uploadSampleFile(page);
  });

  test("applies speed multiplier and updates trim end max label", async ({
    page,
  }) => {
    const trimEndLabel = page.locator('label[for="trim-end"]');
    const originalLabel = await trimEndLabel.textContent();

    // Apply 2x speed - timestamps should be halved
    const speedInput = page.locator("#speed-multiplier");
    await speedInput.fill("2");
    await page.getByRole("button", { name: "Apply" }).click();

    // The max duration in the trim-end label should decrease
    const newLabel = await trimEndLabel.textContent();
    expect(newLabel).not.toBe(originalLabel);
  });

  test("compresses idle time and updates trim end max label", async ({
    page,
  }) => {
    const trimEndLabel = page.locator('label[for="trim-end"]');
    const originalLabel = await trimEndLabel.textContent();

    // Set a low threshold to trigger compression
    await page.locator("#idle-threshold").fill("0.4");
    await page.locator("#compressed-duration").fill("0.1");
    await page.getByRole("button", { name: "Compress" }).click();

    const newLabel = await trimEndLabel.textContent();
    expect(newLabel).not.toBe(originalLabel);
  });
});

test.describe("Trim Controls", () => {
  test.beforeEach(async ({ page }) => {
    await uploadSampleFile(page);
  });

  test("trims start and reduces total duration", async ({ page }) => {
    const trimEndLabel = page.locator('label[for="trim-end"]');
    const originalLabel = await trimEndLabel.textContent();

    await page.locator("#trim-start").fill("0.5");
    await page
      .locator(".control-group")
      .filter({ has: page.locator("#trim-start") })
      .getByRole("button", { name: "Trim" })
      .click();

    // Duration should decrease after trimming the start
    const newLabel = await trimEndLabel.textContent();
    expect(newLabel).not.toBe(originalLabel);
  });

  test("trims end and reduces total duration", async ({ page }) => {
    const trimEndLabel = page.locator('label[for="trim-end"]');

    await page.locator("#trim-end").fill("1.0");
    await page
      .locator(".control-group")
      .filter({ has: page.locator("#trim-end") })
      .getByRole("button", { name: "Trim" })
      .click();

    // Max should now be 1.0 or less
    const newLabel = await trimEndLabel.textContent();
    expect(newLabel).toContain("1.0");
  });

  test("reset button restores original data after edits", async ({
    page,
  }) => {
    const trimEndLabel = page.locator('label[for="trim-end"]');
    const originalLabel = await trimEndLabel.textContent();

    // Trim start to modify the data
    await page.locator("#trim-start").fill("0.5");
    await page
      .locator(".control-group")
      .filter({ has: page.locator("#trim-start") })
      .getByRole("button", { name: "Trim" })
      .click();

    // Click reset
    await page.getByRole("button", { name: "Reset" }).click();

    // Duration should be restored to original
    await expect(trimEndLabel).toHaveText(originalLabel!);
  });
});
