import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Player } from "../Player";

// Mock asciinema-player since it requires a real DOM with canvas
const mockDispose = vi.fn();
const mockCreate = vi.fn().mockReturnValue({
  el: document.createElement("div"),
  dispose: mockDispose,
  play: vi.fn(),
  pause: vi.fn(),
  seek: vi.fn(),
  getCurrentTime: vi.fn(),
  getDuration: vi.fn(),
  addEventListener: vi.fn(),
});

vi.mock("asciinema-player", () => ({
  create: (...args: unknown[]) => mockCreate(...args),
}));

const CAST_CONTENT = [
  '{"version": 2, "width": 80, "height": 24}',
  '[0.5, "o", "hello"]',
].join("\n");

const noopReady = vi.fn();
const noopDispose = vi.fn();
const DEFAULT_PROPS = {
  castContent: CAST_CONTENT,
  width: 80,
  height: 24,
  onPlayerReady: noopReady,
  onPlayerDispose: noopDispose,
};

beforeEach(() => {
  mockCreate.mockClear();
  mockDispose.mockClear();
  noopReady.mockClear();
  noopDispose.mockClear();
});

describe("Player", () => {
  it("renders a container div", () => {
    render(<Player {...DEFAULT_PROPS} />);
    expect(screen.getByTestId("player-container")).toBeInTheDocument();
  });

  it("calls AsciinemaPlayer.create with blob URL and options", () => {
    render(<Player {...DEFAULT_PROPS} />);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const [src, container, opts] = mockCreate.mock.calls[0];

    // src should be a data URL with percent-encoded content
    expect(src).toMatch(/^data:text\/plain,/);
    expect(container).toBeInstanceOf(HTMLElement);
    expect(opts).toEqual({
      cols: 80,
      rows: 24,
      autoPlay: false,
      preload: true,
      controls: false,
      fit: "both",
    });
  });

  it("disposes player on unmount", () => {
    render(<Player {...DEFAULT_PROPS} />);
    cleanup();
    expect(mockDispose).toHaveBeenCalledTimes(1);
  });

  it("recreates player when castContent changes", () => {
    const { rerender } = render(<Player {...DEFAULT_PROPS} />);
    expect(mockCreate).toHaveBeenCalledTimes(1);

    const newContent = [
      '{"version": 2, "width": 120, "height": 40}',
      '[0.1, "o", "new"]',
    ].join("\n");

    rerender(<Player {...DEFAULT_PROPS} castContent={newContent} />);
    // Previous player disposed, new one created
    expect(mockDispose).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("calls onPlayerReady with created player instance", () => {
    render(<Player {...DEFAULT_PROPS} />);
    expect(noopReady).toHaveBeenCalledTimes(1);
    expect(noopReady).toHaveBeenCalledWith(mockCreate.mock.results[0].value);
  });

  it("passes terminalFontFamily when fontConfig has a font family", () => {
    render(<Player {...DEFAULT_PROPS} fontConfig={{ fontFamily: "Fira Code" }} />);
    const [, , opts] = mockCreate.mock.calls[0];
    expect(opts.terminalFontFamily).toBe("Fira Code");
  });

  it("does not set terminalFontFamily when fontConfig has empty font family", () => {
    render(<Player {...DEFAULT_PROPS} fontConfig={{ fontFamily: "" }} />);
    const [, , opts] = mockCreate.mock.calls[0];
    expect(opts.terminalFontFamily).toBeUndefined();
  });

  it("recreates player when fontConfig changes", () => {
    const { rerender } = render(<Player {...DEFAULT_PROPS} fontConfig={{ fontFamily: "Fira Code" }} />);
    expect(mockCreate).toHaveBeenCalledTimes(1);

    rerender(<Player {...DEFAULT_PROPS} fontConfig={{ fontFamily: "JetBrains Mono" }} />);
    expect(mockDispose).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledTimes(2);
    const [, , opts] = mockCreate.mock.calls[1];
    expect(opts.terminalFontFamily).toBe("JetBrains Mono");
  });
});
