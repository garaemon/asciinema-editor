import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sampleCastPath = path.resolve(currentDir, "fixtures/sample.cast");
const invalidCastPath = path.resolve(currentDir, "fixtures/invalid.cast");

test.describe("File Upload Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows upload screen on initial load", async ({ page }) => {
    await expect(
      page.getByText("Drop .cast file here or click to upload")
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "asciinema editor" })).toBeVisible();
  });

  test("transitions to editing screen after uploading valid .cast file", async ({
    page,
  }) => {
    const fileInput = page.getByTestId("file-input");
    await fileInput.setInputFiles(sampleCastPath);

    // Should transition to editing screen
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Export" })).toBeVisible();

    // Should show sidebar panels
    await expect(page.getByRole("heading", { name: "Speed" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Trim" })).toBeVisible();

    // Player container should be in the DOM
    await expect(page.getByTestId("player-container")).toBeAttached();
  });

  test("shows error message for invalid file", async ({ page }) => {
    const fileInput = page.getByTestId("file-input");
    await fileInput.setInputFiles(invalidCastPath);

    // Should stay on upload screen and show error
    await expect(page.getByTestId("upload-error")).toBeVisible();
    await expect(
      page.getByText("Drop .cast file here or click to upload")
    ).toBeVisible();
  });

  test("navigates between Edit and Export screens", async ({ page }) => {
    // Upload a valid file first
    const fileInput = page.getByTestId("file-input");
    await fileInput.setInputFiles(sampleCastPath);

    // Should be on editing screen with sidebar
    await expect(page.getByRole("heading", { name: "Speed" })).toBeVisible();

    // Navigate to Export
    await page.getByRole("button", { name: "Export" }).click();
    await expect(page.getByRole("heading", { name: "Export" })).toBeVisible();
    // Sidebar should be gone
    await expect(page.getByRole("heading", { name: "Speed" })).not.toBeVisible();

    // Navigate back to Edit
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(page.getByRole("heading", { name: "Speed" })).toBeVisible();
  });
});
