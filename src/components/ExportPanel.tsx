import { useState, useRef } from 'react';
import type { AsciicastData } from '../types/asciicast';
import { serializeAsciicast } from '../lib/serializer';
import { Player } from './Player';
import { DEFAULT_FONT_CONFIG } from '../types/fontConfig';
import type { GifExportOptions } from '../lib/gif-exporter';

const DEFAULT_GIF_OPTIONS: GifExportOptions = {
  fps: 10,
  quality: 10,
};

interface ExportPanelProps {
  data: AsciicastData;
  castContent: string;
}

type Mp4State = 'idle' | 'loading' | 'ready' | 'error';

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
  const [mp4State, setMp4State] = useState<Mp4State>('idle');
  const [mp4Progress, setMp4Progress] = useState(0);
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

  const handleLoadFfmpeg = async () => {
    setMp4State('loading');
    setMp4Progress(0);
    try {
      const { loadFfmpeg } = await import('../lib/mp4-exporter');
      await loadFfmpeg((progress) => setMp4Progress(progress));
      setMp4State('ready');
    } catch {
      setMp4State('error');
    }
  };

  const renderMp4Button = () => {
    switch (mp4State) {
    case 'idle':
      return (
        <button className="export-button" onClick={handleLoadFfmpeg}>
          Download MP4
        </button>
      );
    case 'loading':
      return (
        <button className="export-button" disabled>
          Loading ffmpeg... {Math.round(mp4Progress * 100)}%
        </button>
      );
    case 'ready':
      return (
        <button className="export-button" disabled>
          Download MP4 (encoding not yet implemented)
        </button>
      );
    case 'error':
      return (
        <button className="export-button" onClick={handleLoadFfmpeg}>
          Download MP4 (load failed — click to retry)
        </button>
      );
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
          fontConfig={DEFAULT_FONT_CONFIG}
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
          {isExporting ? 'Exporting...' : 'Download GIF (static only)'}
        </button>
        {renderMp4Button()}
      </div>
    </div>
  );
}
