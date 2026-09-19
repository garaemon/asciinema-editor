import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AnnotationOverlay } from "../AnnotationOverlay";
import type { Annotation } from "../../types/annotation";

const COLS = 80;
const ROWS = 24;

const callout: Annotation = {
  id: "c1", kind: "callout", start: 1, end: 3,
  title: "Tip", body: "Run the tests", anchor: { type: "cell", row: 6, col: 40 }, pointer: "up",
};
const highlight: Annotation = {
  id: "h1", kind: "highlight", start: 0, end: 10,
  region: { row: 6, col: 40, rowCount: 6, colCount: 10 },
};
const caption: Annotation = { id: "cap", kind: "caption", start: 0, end: 10, text: "Now we build" };
const step1: Annotation = { id: "s1", kind: "step", start: 0, end: 10, corner: "top-right" };
const step2: Annotation = { id: "s2", kind: "step", start: 20, end: 30, corner: "top-left", label: "Done" };

function renderOverlay(annotations: Annotation[], outputTime: number, terminalRect?: { left: number; top: number; width: number; height: number }) {
  return render(
    <AnnotationOverlay annotations={annotations} outputTime={outputTime} cols={COLS} rows={ROWS} terminalRect={terminalRect} />,
  );
}

describe("AnnotationOverlay", () => {
  it("renders an empty overlay container when nothing is visible", () => {
    renderOverlay([callout], 5);
    const overlay = screen.getByTestId("annotation-overlay");
    expect(overlay).toBeInTheDocument();
    expect(overlay).toBeEmptyDOMElement();
  });

  it("renders a callout with title and body at the anchored cell", () => {
    renderOverlay([callout], 2);
    const element = screen.getByText("Run the tests").closest(".annotation-callout");
    expect(element).toHaveStyle({ left: "50%", top: "25%" });
    expect(element).toHaveAttribute("data-pointer", "up");
    expect(screen.getByText("Tip")).toBeInTheDocument();
  });

  it("renders a highlight rectangle over the cell region", () => {
    const { container } = renderOverlay([highlight], 5);
    const element = container.querySelector(".annotation-highlight");
    expect(element).toHaveStyle({ left: "50%", top: "25%", width: "12.5%", height: "25%" });
  });

  it("renders a caption bar with its text", () => {
    renderOverlay([caption], 5);
    expect(screen.getByText("Now we build")).toHaveClass("annotation-caption");
  });

  it("numbers step badges by start order and honors custom labels", () => {
    renderOverlay([step2, step1], 5);
    const badge = screen.getByText("Step 1/2");
    expect(badge).toHaveClass("annotation-step");
    expect(badge).toHaveAttribute("data-corner", "top-right");
    expect(screen.queryByText("Done")).not.toBeInTheDocument();
    renderOverlay([step2, step1], 25);
    expect(screen.getByText("Done")).toHaveAttribute("data-corner", "top-left");
  });

  it("offsets positions into the measured terminal rect", () => {
    const { container } = renderOverlay([highlight], 5, { left: 10, top: 5, width: 80, height: 90 });
    const element = container.querySelector(".annotation-highlight");
    expect(element).toHaveStyle({ left: "50%", top: "27.5%", width: "10%", height: "22.5%" });
  });
});
