import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MaskControls } from "../MaskControls";
import type { AsciicastData } from "../../types/asciicast";

const sampleData: AsciicastData = {
  header: { version: 2, width: 80, height: 24 },
  events: [
    [0.5, "o", "hello secret world"],
    [1.0, "o", "another secret line"],
  ],
};

describe("MaskControls", () => {
  it("renders pattern and replacement inputs", () => {
    render(<MaskControls data={sampleData} onDataChange={vi.fn()} />);

    expect(screen.getByLabelText("Search pattern")).toBeInTheDocument();
    expect(screen.getByLabelText("Replacement")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply Mask" })).toBeInTheDocument();
  });

  it("shows match count preview", async () => {
    const user = userEvent.setup();
    render(<MaskControls data={sampleData} onDataChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Search pattern"), "secret");
    expect(screen.getByText("2 matches found")).toBeInTheDocument();
  });

  it("applies mask and calls onDataChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MaskControls data={sampleData} onDataChange={onChange} />);

    await user.type(screen.getByLabelText("Search pattern"), "secret");
    await user.click(screen.getByRole("button", { name: "Apply Mask" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const result = onChange.mock.calls[0][0] as AsciicastData;
    expect(result.events[0][2]).toBe("hello *** world");
    expect(result.events[1][2]).toBe("another *** line");
  });

  it("clears inputs after applying", async () => {
    const user = userEvent.setup();
    render(<MaskControls data={sampleData} onDataChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Search pattern"), "secret");
    await user.click(screen.getByRole("button", { name: "Apply Mask" }));

    expect(screen.getByLabelText("Search pattern")).toHaveValue("");
  });

  it("supports regex mode", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MaskControls data={sampleData} onDataChange={onChange} />);

    await user.click(screen.getByLabelText("Regex"));
    await user.type(screen.getByLabelText("Search pattern"), "se\\w+");
    await user.click(screen.getByRole("button", { name: "Apply Mask" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const result = onChange.mock.calls[0][0] as AsciicastData;
    expect(result.events[0][2]).toBe("hello *** world");
  });

  it("shows case-insensitive toggle only in regex mode", async () => {
    const user = userEvent.setup();
    render(<MaskControls data={sampleData} onDataChange={vi.fn()} />);

    expect(screen.queryByLabelText("Case insensitive")).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("Regex"));
    expect(screen.getByLabelText("Case insensitive")).toBeInTheDocument();
  });

  it("disables apply when pattern is empty", () => {
    render(<MaskControls data={sampleData} onDataChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Apply Mask" })).toBeDisabled();
  });
});
