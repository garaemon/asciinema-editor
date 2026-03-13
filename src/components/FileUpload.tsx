import { useCallback, useRef, useState } from "react";
import { parseAsciicast } from "../lib/parser";
import type { AsciicastData } from "../types/asciicast";

interface FileUploadProps {
  onFileLoaded: (data: AsciicastData, rawContent: string) => void;
}

export function FileUpload({ onFileLoaded }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          const data = parseAsciicast(content);
          onFileLoaded(data, content);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to parse file"
          );
        }
      };
      reader.onerror = () => setError("Failed to read file");
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div
      className={`upload-zone${isDragOver ? " drag-over" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      data-testid="upload-zone"
    >
      <p>Drop .cast file here or click to upload</p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".cast"
        onChange={handleInputChange}
        data-testid="file-input"
      />
      {error && (
        <p className="upload-error" data-testid="upload-error">
          {error}
        </p>
      )}
    </div>
  );
}
