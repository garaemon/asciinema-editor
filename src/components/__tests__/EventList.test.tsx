import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { EventList } from "../EventList";
import type { AsciicastData } from "../../types/asciicast";

function createTestData(): AsciicastData {
  return {
    header: { version: 2, width: 80, height: 24 },
    events: [
      [0.5, "o", "hello"],
      [1.0, "i", "keypress"],
      [1.5, "o", "\x1b[31mcolored\x1b[0m"],
      [2.0, "m", "marker"],
    ],
  };
}

describe("EventList", () => {
  it("renders all events with timestamps and type badges", () => {
    const data = createTestData();
    render(<EventList data={data} onDataChange={vi.fn()} />);

    expect(screen.getByText("0.500s")).toBeInTheDocument();
    expect(screen.getByText("1.000s")).toBeInTheDocument();
    expect(screen.getByText("1.500s")).toBeInTheDocument();
    expect(screen.getByText("2.000s")).toBeInTheDocument();

    const badges = screen.getAllByTestId("event-type-badge");
    expect(badges).toHaveLength(4);
    expect(badges[0].textContent).toBe("o");
    expect(badges[1].textContent).toBe("i");
  });

  it("renders editable input for output events", () => {
    const data = createTestData();
    render(<EventList data={data} onDataChange={vi.fn()} />);

    const inputs = screen.getAllByRole("textbox");
    // Only output events (2) should have editable inputs
    expect(inputs).toHaveLength(2);
  });

  it("strips ANSI codes in display for output events", () => {
    const data = createTestData();
    render(<EventList data={data} onDataChange={vi.fn()} />);

    const inputs = screen.getAllByRole("textbox");
    // Second output event has ANSI codes - display should strip them
    expect(inputs[1]).toHaveValue("colored");
  });

  it("calls onDataChange when output event text is edited", async () => {
    const user = userEvent.setup();
    const onDataChange = vi.fn();
    const data = createTestData();
    render(<EventList data={data} onDataChange={onDataChange} />);

    const inputs = screen.getAllByRole("textbox");
    await user.clear(inputs[0]);
    await user.type(inputs[0], "world");

    // onDataChange is called on blur
    await user.tab();

    expect(onDataChange).toHaveBeenCalledTimes(1);
    const updatedData = onDataChange.mock.calls[0][0] as AsciicastData;
    expect(updatedData.events[0][2]).toBe("world");
    // Other events should remain unchanged
    expect(updatedData.events[1][2]).toBe("keypress");
  });

  it("shows non-output events as read-only text", () => {
    const data = createTestData();
    render(<EventList data={data} onDataChange={vi.fn()} />);

    // Non-output events should display as plain text, not inputs
    expect(screen.getByText("keypress")).toBeInTheDocument();
    expect(screen.getByText("marker")).toBeInTheDocument();
  });
});
