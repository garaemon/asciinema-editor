import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sampleCastPath = path.resolve(currentDir, "fixtures/sample.cast");

async function uploadFile(page: import("@playwright/test").Page) {
  const fileInput = page.getByTestId("file-input");
  await fileInput.setInputFiles(sampleCastPath);
  await expect(page.getByTestId("timeline")).toBeVisible();
}

function getTimelinePlayButton(page: import("@playwright/test").Page) {
  return page.getByTestId("timeline").getByRole("button", { name: "Play" });
}

function getTimelinePauseButton(page: import("@playwright/test").Page) {
  return page.getByTestId("timeline").getByRole("button", { name: "Pause" });
}

test.describe("Timeline Controls", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows timeline with play button and duration after file upload", async ({ page }) => {
    await uploadFile(page);

    const timeline = page.getByTestId("timeline");
    await expect(timeline).toBeVisible();
    await expect(getTimelinePlayButton(page)).toBeVisible();
    await expect(page.getByRole("slider", { name: "Playback position" })).toBeVisible();
    await expect(timeline.getByText("0:02")).toBeVisible();
  });

  test("attaches player container after upload", async ({ page }) => {
    await uploadFile(page);
    await expect(page.getByTestId("player-container")).toBeAttached();
  });

  test("switches to pause button when playing and back to play on pause", async ({ page }) => {
    await uploadFile(page);

    await expect(getTimelinePlayButton(page)).toBeVisible();

    // Click play -> should show pause
    await getTimelinePlayButton(page).click();
    await expect(getTimelinePauseButton(page)).toBeVisible();

    // Click pause -> should show play
    await getTimelinePauseButton(page).click();
    await expect(getTimelinePlayButton(page)).toBeVisible();
  });

  test("shows current time as 0:00 on initial load", async ({ page }) => {
    await uploadFile(page);

    const timeline = page.getByTestId("timeline");
    // First time display should show 0:00
    await expect(timeline.getByText("0:00")).toBeVisible();
  });
});
