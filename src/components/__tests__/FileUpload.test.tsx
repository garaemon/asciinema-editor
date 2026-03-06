import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FileUpload } from "../FileUpload";

const VALID_CAST_CONTENT = [
  '{"version": 2, "width": 80, "height": 24}',
  '[0.5, "o", "hello"]',
  '[1.0, "o", "world"]',
].join("\n");

const INVALID_CAST_CONTENT = "not valid json at all";

function createFile(content: string, name = "test.cast"): File {
  return new File([content], name, { type: "text/plain" });
}

describe("FileUpload", () => {
  it("renders upload zone with instruction text", () => {
    render(<FileUpload onFileLoaded={vi.fn()} />);
    expect(
      screen.getByText("Drop .cast file here or click to upload")
    ).toBeInTheDocument();
  });

  it("renders a hidden file input", () => {
    render(<FileUpload onFileLoaded={vi.fn()} />);
    const input = screen.getByTestId("file-input");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "file");
    expect(input).toHaveAttribute("accept", ".cast");
  });

  it("calls onFileLoaded with parsed data on valid file selection", async () => {
    const onFileLoaded = vi.fn();
    render(<FileUpload onFileLoaded={onFileLoaded} />);

    const input = screen.getByTestId("file-input");
    const file = createFile(VALID_CAST_CONTENT);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onFileLoaded).toHaveBeenCalledTimes(1);
    });

    const [data, rawContent] = onFileLoaded.mock.calls[0];
    expect(data.header.version).toBe(2);
    expect(data.header.width).toBe(80);
    expect(data.events).toHaveLength(2);
    expect(rawContent).toBe(VALID_CAST_CONTENT);
  });

  it("shows error message on invalid file", async () => {
    render(<FileUpload onFileLoaded={vi.fn()} />);

    const input = screen.getByTestId("file-input");
    const file = createFile(INVALID_CAST_CONTENT);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("upload-error")).toBeInTheDocument();
    });
  });

  it("does not call onFileLoaded on invalid file", async () => {
    const onFileLoaded = vi.fn();
    render(<FileUpload onFileLoaded={onFileLoaded} />);

    const input = screen.getByTestId("file-input");
    const file = createFile(INVALID_CAST_CONTENT);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("upload-error")).toBeInTheDocument();
    });
    expect(onFileLoaded).not.toHaveBeenCalled();
  });

  it("clears previous error when a new valid file is loaded", async () => {
    const onFileLoaded = vi.fn();
    render(<FileUpload onFileLoaded={onFileLoaded} />);

    const input = screen.getByTestId("file-input");

    // First: invalid file
    fireEvent.change(input, {
      target: { files: [createFile(INVALID_CAST_CONTENT)] },
    });
    await waitFor(() => {
      expect(screen.getByTestId("upload-error")).toBeInTheDocument();
    });

    // Second: valid file
    fireEvent.change(input, {
      target: { files: [createFile(VALID_CAST_CONTENT)] },
    });
    await waitFor(() => {
      expect(screen.queryByTestId("upload-error")).not.toBeInTheDocument();
    });
  });

  it("adds drag-over class on dragover and removes on dragleave", () => {
    render(<FileUpload onFileLoaded={vi.fn()} />);
    const zone = screen.getByTestId("upload-zone");

    fireEvent.dragOver(zone, { dataTransfer: { files: [] } });
    expect(zone.className).toContain("drag-over");

    fireEvent.dragLeave(zone);
    expect(zone.className).not.toContain("drag-over");
  });

  it("handles file drop with valid file", async () => {
    const onFileLoaded = vi.fn();
    render(<FileUpload onFileLoaded={onFileLoaded} />);

    const zone = screen.getByTestId("upload-zone");
    const file = createFile(VALID_CAST_CONTENT);

    fireEvent.drop(zone, { dataTransfer: { files: [file] } });

    await waitFor(() => {
      expect(onFileLoaded).toHaveBeenCalledTimes(1);
    });
  });

  it("opens file dialog on click", () => {
    render(<FileUpload onFileLoaded={vi.fn()} />);
    const input = screen.getByTestId("file-input");
    const clickSpy = vi.spyOn(input, "click");

    const zone = screen.getByTestId("upload-zone");
    fireEvent.click(zone);

    expect(clickSpy).toHaveBeenCalled();
  });
});
