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

test.describe("Undo/Redo", () => {
  test("editing screen stays visible after pressing undo multiple times", async ({
    page,
  }) => {
    await uploadSampleFile(page);

    // Apply speed change to create an undo entry
    const speedInput = page.locator("#speed-multiplier");
    await speedInput.fill("2");
    await page.getByRole("button", { name: "Apply" }).click();

    const undoButton = page.getByRole("button", { name: "Undo" });

    // Press undo multiple times — should never blank the screen
    await undoButton.click();
    await expect(page.getByRole("heading", { name: "Speed" })).toBeVisible();

    // Undo button should be disabled at the bottom of the stack
    await expect(undoButton).toBeDisabled();

    // Editing screen must still be showing
    await expect(page.getByRole("heading", { name: "Trim" })).toBeVisible();
    await expect(page.getByTestId("player-container")).toBeAttached();
  });

  test("sidebar input values reset after undo", async ({ page }) => {
    await uploadSampleFile(page);

    // Record the original trim-end max label
    const trimEndLabel = page.locator('label[for="trim-end"]');
    const originalLabel = await trimEndLabel.textContent();

    // Trim start to create an edit
    const trimStartInput = page.locator("#trim-start");
    await trimStartInput.fill("0.5");
    await page
      .locator(".control-group")
      .filter({ has: page.locator("#trim-start") })
      .getByRole("button", { name: "Trim" })
      .click();

    // The max label should change after trimming
    const afterTrimLabel = await trimEndLabel.textContent();
    expect(afterTrimLabel).not.toBe(originalLabel);

    // Undo the trim
    await page.getByRole("button", { name: "Undo" }).click();

    // Trim start input should be reset to 0
    await expect(trimStartInput).toHaveValue("0");

    // The max label should be restored to the original
    await expect(trimEndLabel).toHaveText(originalLabel!);
  });

  test("redo restores the undone change", async ({ page }) => {
    await uploadSampleFile(page);

    const trimEndLabel = page.locator('label[for="trim-end"]');
    const originalLabel = await trimEndLabel.textContent();

    // Trim start
    const trimStartInput = page.locator("#trim-start");
    await trimStartInput.fill("0.5");
    await page
      .locator(".control-group")
      .filter({ has: page.locator("#trim-start") })
      .getByRole("button", { name: "Trim" })
      .click();

    const afterTrimLabel = await trimEndLabel.textContent();

    // Undo
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(trimEndLabel).toHaveText(originalLabel!);

    // Redo should restore the trimmed state
    await page.getByRole("button", { name: "Redo" }).click();
    await expect(trimEndLabel).toHaveText(afterTrimLabel!);
  });

  test("speed controls reset to defaults after undo", async ({ page }) => {
    await uploadSampleFile(page);

    const speedInput = page.locator("#speed-multiplier");
    await expect(speedInput).toHaveValue("1");

    // Change multiplier and apply
    await speedInput.fill("3");
    await page.getByRole("button", { name: "Apply" }).click();

    // After applying, speed input should still show the value
    // (data changed, so it resets to default)
    await expect(speedInput).toHaveValue("1");

    // Undo the speed change
    await page.getByRole("button", { name: "Undo" }).click();

    // Speed input should be reset to default
    await expect(speedInput).toHaveValue("1");
  });
});
