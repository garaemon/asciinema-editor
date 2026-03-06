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

beforeEach(() => {
  mockCreate.mockClear();
  mockDispose.mockClear();
});

describe("Player", () => {
  it("renders a container div", () => {
    render(<Player castContent={CAST_CONTENT} />);
    expect(screen.getByTestId("player-container")).toBeInTheDocument();
  });

  it("calls AsciinemaPlayer.create with blob URL and options", () => {
    render(<Player castContent={CAST_CONTENT} width={80} height={24} />);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const [src, container, opts] = mockCreate.mock.calls[0];

    // src should be a blob URL
    expect(src).toMatch(/^blob:/);
    expect(container).toBeInstanceOf(HTMLElement);
    expect(opts).toEqual({
      cols: 80,
      rows: 24,
      autoPlay: false,
      controls: true,
      fit: "both",
    });
  });

  it("disposes player on unmount", () => {
    render(<Player castContent={CAST_CONTENT} />);
    cleanup();
    expect(mockDispose).toHaveBeenCalledTimes(1);
  });

  it("recreates player when castContent changes", () => {
    const { rerender } = render(<Player castContent={CAST_CONTENT} />);
    expect(mockCreate).toHaveBeenCalledTimes(1);

    const newContent = [
      '{"version": 2, "width": 120, "height": 40}',
      '[0.1, "o", "new"]',
    ].join("\n");

    rerender(<Player castContent={newContent} />);
    // Previous player disposed, new one created
    expect(mockDispose).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("passes undefined cols/rows when width/height not provided", () => {
    render(<Player castContent={CAST_CONTENT} />);
    const [, , opts] = mockCreate.mock.calls[0];
    expect(opts.cols).toBeUndefined();
    expect(opts.rows).toBeUndefined();
  });
});
