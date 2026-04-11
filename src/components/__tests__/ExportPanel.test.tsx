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
  it("renders a single shared FPS slider", () => {
    render(<ExportPanel {...DEFAULT_PROPS} />);
    const sliders = screen.getAllByLabelText(/FPS/i);
    expect(sliders).toHaveLength(1);
  });

  it("renders a single shared Width slider", () => {
    render(<ExportPanel {...DEFAULT_PROPS} />);
    const sliders = screen.getAllByLabelText(/Width/i);
    expect(sliders).toHaveLength(1);
  });

  it("renders a GIF Quality slider", () => {
    render(<ExportPanel {...DEFAULT_PROPS} />);
    expect(screen.getByLabelText(/Quality/i)).toBeInTheDocument();
  });

  it("shows default shared settings values", () => {
    render(<ExportPanel {...DEFAULT_PROPS} />);
    const fpsSlider = screen.getByLabelText(/FPS/i) as HTMLInputElement;
    const widthSlider = screen.getByLabelText(/Width/i) as HTMLInputElement;
    expect(Number(fpsSlider.value)).toBe(10);
    expect(Number(widthSlider.value)).toBe(640);
  });

  it("width slider has correct min/max/step attributes", () => {
    render(<ExportPanel {...DEFAULT_PROPS} />);
    const slider = screen.getByLabelText(/Width/i) as HTMLInputElement;
    expect(slider.min).toBe("320");
    expect(slider.max).toBe("1920");
    expect(slider.step).toBe("80");
  });

  it("renders a format selector with three options", () => {
    render(<ExportPanel {...DEFAULT_PROPS} />);
    const select = screen.getByLabelText(/Format/i);
    expect(select).toBeInTheDocument();
    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual([
      "Asciicast (.cast)",
      "Animated GIF",
      "MP4 Video",
    ]);
  });

  it("renders a single download button", () => {
    render(<ExportPanel {...DEFAULT_PROPS} />);
    const buttons = screen.getAllByRole("button", { name: /Download/i });
    expect(buttons).toHaveLength(1);
  });

  it("displays frame estimate", () => {
    render(<ExportPanel {...DEFAULT_PROPS} />);
    expect(screen.getByText(/~10 frames/)).toBeInTheDocument();
  });
});
