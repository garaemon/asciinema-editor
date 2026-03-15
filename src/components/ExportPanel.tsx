import { useState } from 'react';
import type { AsciicastData } from '../types/asciicast';
import { serializeAsciicast } from '../lib/serializer';
import { DEFAULT_GIF_OPTIONS } from '../lib/gif-exporter';
import type { GifExportOptions } from '../lib/gif-exporter';

interface ExportPanelProps {
  data: AsciicastData;
  playerElement?: HTMLElement | null;
}

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/x-asciicast' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function triggerBlobDownload(data: Uint8Array, filename: string, mimeType: string) {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExportPanel({ data, playerElement }: ExportPanelProps) {
  const [gifOptions] = useState<GifExportOptions>(DEFAULT_GIF_OPTIONS);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCast = () => {
    const serialized = serializeAsciicast(data);
    triggerDownload(serialized, 'edited.cast');
  };

  const handleExportGif = async () => {
    if (!playerElement) {
      return;
    }
    setIsExporting(true);
    try {
      // Single-frame GIF capture as MVP
      const { captureFrame, renderFrameToCanvas, encodeGif } = await import('../lib/gif-exporter');
      const image = await captureFrame(playerElement);
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const imageData = await renderFrameToCanvas(image, canvas);
      const gifData = encodeGif([imageData], canvas.width, canvas.height, gifOptions);
      triggerBlobDownload(gifData, 'recording.gif', 'image/gif');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-panel">
      <h2>Export</h2>
      <div className="export-options">
        <button className="export-button" onClick={handleExportCast}>
          Download .cast
        </button>
        <button
          className="export-button export-button-gif"
          onClick={handleExportGif}
          disabled={isExporting || !playerElement}
        >
          {isExporting ? 'Exporting...' : 'Download GIF (single frame)'}
        </button>
        <p className="placeholder">MP4 export coming soon</p>
      </div>
    </div>
  );
}
