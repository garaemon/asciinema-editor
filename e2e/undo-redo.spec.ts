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

  test("speed multiplier value persists after apply", async ({ page }) => {
    await uploadSampleFile(page);

    const speedInput = page.locator("#speed-multiplier");
    await expect(speedInput).toHaveValue("1");

    // Change multiplier and apply
    await speedInput.fill("3");
    await page.getByRole("button", { name: "Apply" }).click();

    // Speed input should keep the user's value after applying
    await expect(speedInput).toHaveValue("3");
  });

  test("speed multiplier resets to default after undo", async ({ page }) => {
    await uploadSampleFile(page);

    const speedInput = page.locator("#speed-multiplier");

    // Change multiplier and apply
    await speedInput.fill("3");
    await page.getByRole("button", { name: "Apply" }).click();

    // Value should persist after apply
    await expect(speedInput).toHaveValue("3");

    // Undo should reset speed input to default
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(speedInput).toHaveValue("1");
  });

  test("idle compression values reset after undo", async ({ page }) => {
    await uploadSampleFile(page);

    const thresholdInput = page.locator("#idle-threshold");
    const compressToInput = page.locator("#compressed-duration");

    // Change idle compression and apply
    await thresholdInput.fill("1");
    await compressToInput.fill("0.2");
    await page.getByRole("button", { name: "Compress" }).click();

    // Values should persist after compress
    await expect(thresholdInput).toHaveValue("1");
    await expect(compressToInput).toHaveValue("0.2");

    // Undo should reset to defaults
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(thresholdInput).toHaveValue("2");
    await expect(compressToInput).toHaveValue("0.5");
  });

  test("font config reverts on undo", async ({ page }) => {
    await uploadSampleFile(page);

    const fontSelect = page.locator(".font-select");
    await expect(fontSelect).toHaveValue("");

    // Change font
    await fontSelect.selectOption("Fira Code");
    await expect(fontSelect).toHaveValue("Fira Code");

    // Undo should revert font
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(fontSelect).toHaveValue("");
  });
});
