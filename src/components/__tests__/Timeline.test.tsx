import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Timeline } from "../Timeline";
import type { AsciicastEvent } from "../../types/asciicast";

function createMockPlayer(overrides: Record<string, unknown> = {}) {
  return {
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn().mockResolvedValue(undefined),
    seek: vi.fn().mockResolvedValue(undefined),
    getCurrentTime: vi.fn().mockResolvedValue(0),
    getDuration: vi.fn().mockResolvedValue(2),
    addEventListener: vi.fn(),
    dispose: vi.fn(),
    el: document.createElement("div"),
    ...overrides,
  };
}

describe("Timeline", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows placeholder when player is null", () => {
    render(<Timeline player={null} totalDuration={0} />);
    expect(screen.getByText("Load a file to see the timeline")).toBeInTheDocument();
  });

  it("shows play button when player is provided", () => {
    const player = createMockPlayer();
    render(<Timeline player={player} totalDuration={2} />);
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("shows formatted total duration", () => {
    const player = createMockPlayer();
    render(<Timeline player={player} totalDuration={125} />);
    expect(screen.getByText("2:05")).toBeInTheDocument();
  });

  it("calls player.play when play button is clicked", async () => {
    const player = createMockPlayer();
    render(<Timeline player={player} totalDuration={2} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(player.play).toHaveBeenCalledTimes(1);
  });

  it("calls player.pause when pause button is clicked", async () => {
    const eventHandlers: Record<string, () => void> = {};
    const player = createMockPlayer({
      addEventListener: vi.fn((event: string, handler: () => void) => {
        eventHandlers[event] = handler;
      }),
    });

    render(<Timeline player={player} totalDuration={2} />);

    // Simulate player emitting "play" event to switch to Pause button
    act(() => {
      eventHandlers["play"]();
    });
    const pauseButton = await screen.findByRole("button", { name: "Pause" });
    fireEvent.click(pauseButton);
    expect(player.pause).toHaveBeenCalledTimes(1);
  });

  it("registers play, pause, and ended event listeners", () => {
    const player = createMockPlayer();
    render(<Timeline player={player} totalDuration={2} />);

    const addEventCalls = (player.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const registeredEvents = addEventCalls.map((call: unknown[]) => call[0]);
    expect(registeredEvents).toContain("play");
    expect(registeredEvents).toContain("pause");
    expect(registeredEvents).toContain("ended");
  });

  it("switches to Play icon when ended event fires", async () => {
    const eventHandlers: Record<string, () => void> = {};
    const player = createMockPlayer({
      addEventListener: vi.fn((event: string, handler: () => void) => {
        eventHandlers[event] = handler;
      }),
    });

    render(<Timeline player={player} totalDuration={2} />);

    // Simulate play then ended
    act(() => {
      eventHandlers["play"]();
    });
    await screen.findByRole("button", { name: "Pause" });

    act(() => {
      eventHandlers["ended"]();
    });
    expect(await screen.findByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("has accessible slider element", () => {
    const player = createMockPlayer();
    render(<Timeline player={player} totalDuration={10} />);

    const slider = screen.getByRole("slider", { name: "Playback position" });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "10");
  });

  it("renders previous and next event buttons", () => {
    const player = createMockPlayer();
    const events: AsciicastEvent[] = [[1, "o", "a"], [2, "o", "b"]];
    render(<Timeline player={player} totalDuration={2} events={events} />);
    expect(screen.getByRole("button", { name: "Previous event" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next event" })).toBeInTheDocument();
  });

  it("disables previous button at the start", () => {
    const player = createMockPlayer({ getCurrentTime: vi.fn().mockResolvedValue(0) });
    const events: AsciicastEvent[] = [[1, "o", "a"], [2, "o", "b"]];
    render(<Timeline player={player} totalDuration={2} events={events} />);
    expect(screen.getByRole("button", { name: "Previous event" })).toBeDisabled();
  });

  it("seeks to the next event when next button is clicked", async () => {
    const player = createMockPlayer({ getCurrentTime: vi.fn().mockResolvedValue(0) });
    const events: AsciicastEvent[] = [[1, "o", "a"], [2, "o", "b"]];
    render(<Timeline player={player} totalDuration={2} events={events} />);
    fireEvent.click(screen.getByRole("button", { name: "Next event" }));
    await waitFor(() => expect(player.seek).toHaveBeenCalledWith(1));
  });
});
