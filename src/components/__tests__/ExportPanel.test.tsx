import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ExportPanel } from "../ExportPanel";
import type { AsciicastData } from "../../types/asciicast";

// Mock asciinema-player
vi.mock("asciinema-player", () => ({
  create: vi.fn().mockReturnValue({
    el: document.createElement("div"),
    dispose: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
    getCurrentTime: vi.fn(),
    getDuration: vi.fn(),
    addEventListener: vi.fn(),
  }),
}));

const CAST_CONTENT = [
  '{"version": 2, "width": 80, "height": 24}',
  '[0.5, "o", "hello"]',
].join("\n");

const TEST_DATA: AsciicastData = {
  header: { version: 2, width: 80, height: 24 },
  events: [[0.5, "o", "hello"]],
};

const DEFAULT_PROPS = {
  data: TEST_DATA,
  castContent: CAST_CONTENT,
  fontConfig: { fontFamily: "" },
  duration: 1.0,
};

describe("ExportPanel", () => {
  it("renders resolution width control for GIF", () => {
    render(<ExportPanel {...DEFAULT_PROPS} />);
    expect(screen.getByLabelText(/GIF Width/i)).toBeInTheDocument();
  });

  it("renders resolution width control for MP4", () => {
    render(<ExportPanel {...DEFAULT_PROPS} />);
    expect(screen.getByLabelText(/MP4 Width/i)).toBeInTheDocument();
  });

  it("shows default GIF width value", () => {
    render(<ExportPanel {...DEFAULT_PROPS} />);
    const slider = screen.getByLabelText(/GIF Width/i) as HTMLInputElement;
    expect(Number(slider.value)).toBe(640);
  });

  it("shows default MP4 width value", () => {
    render(<ExportPanel {...DEFAULT_PROPS} />);
    const slider = screen.getByLabelText(/MP4 Width/i) as HTMLInputElement;
    expect(Number(slider.value)).toBe(800);
  });

  it("GIF width slider has correct min/max/step attributes", () => {
    render(<ExportPanel {...DEFAULT_PROPS} />);
    const slider = screen.getByLabelText(/GIF Width/i) as HTMLInputElement;
    expect(slider.min).toBe("320");
    expect(slider.max).toBe("1920");
    expect(slider.step).toBe("80");
  });

  it("displays width value label for GIF", () => {
    render(<ExportPanel {...DEFAULT_PROPS} />);
    expect(screen.getByText(/640px/)).toBeInTheDocument();
  });

  it("displays width value label for MP4", () => {
    render(<ExportPanel {...DEFAULT_PROPS} />);
    expect(screen.getByText(/800px/)).toBeInTheDocument();
  });
});
