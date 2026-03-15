import { useState, useRef } from 'react';
import type { AsciicastData } from '../types/asciicast';
import { serializeAsciicast } from '../lib/serializer';
import { Player } from './Player';
import type { GifExportOptions } from '../lib/gif-exporter';

const DEFAULT_GIF_OPTIONS: GifExportOptions = {
  fps: 10,
  quality: 10,
};

interface ExportPanelProps {
  data: AsciicastData;
  castContent: string;
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

export function ExportPanel({ data, castContent }: ExportPanelProps) {
  const [gifOptions] = useState<GifExportOptions>(DEFAULT_GIF_OPTIONS);
  const [isExporting, setIsExporting] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const handlePlayerReady = () => {
    // Player is ready for GIF capture
  };

  const handlePlayerDispose = () => {
    // No-op
  };

  const handleExportCast = () => {
    const serialized = serializeAsciicast(data);
    triggerDownload(serialized, 'edited.cast');
  };

  const handleExportGif = async () => {
    const playerElement = playerContainerRef.current;
    if (!playerElement) {
      return;
    }
    setIsExporting(true);
    try {
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
      <div className="export-preview" ref={playerContainerRef}>
        <Player
          castContent={castContent}
          width={data.header.width}
          height={data.header.height}
          onPlayerReady={handlePlayerReady}
          onPlayerDispose={handlePlayerDispose}
        />
      </div>
      <div className="export-options">
        <button className="export-button" onClick={handleExportCast}>
          Download .cast
        </button>
        <button
          className="export-button export-button-gif"
          onClick={handleExportGif}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Download GIF'}
        </button>
        <p className="placeholder">MP4 export coming soon</p>
      </div>
    </div>
  );
}
