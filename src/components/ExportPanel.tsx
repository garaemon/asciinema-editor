import { useState, useRef, useCallback } from 'react';
import type { AsciicastData } from '../types/asciicast';
import { serializeAsciicast } from '../lib/serializer';
import { Player } from './Player';
import type { FontConfig } from '../types/fontConfig';
import { useExport } from '../hooks/useExport';
import type { Player as AsciinemaPlayer } from 'asciinema-player';

interface ExportPanelProps {
  data: AsciicastData;
  castContent: string;
  fontConfig: FontConfig;
}

type Mp4State = 'idle' | 'loading' | 'ready' | 'error';

// Compute recording duration from header or last event timestamp
function computeDuration(data: AsciicastData): number {
  if (data.header.duration) {
    return data.header.duration;
  }
  if (data.events.length === 0) {
    return 0;
  }
  return data.events[data.events.length - 1][0];
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

export function ExportPanel({ data, castContent, fontConfig }: ExportPanelProps) {
  const [gifFps, setGifFps] = useState(10);
  const [gifQuality, setGifQuality] = useState(10);
  const [mp4State, setMp4State] = useState<Mp4State>('idle');
  const [mp4Progress, setMp4Progress] = useState(0);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<AsciinemaPlayer | null>(null);
  const { isExporting, progress, exportGif } = useExport();

  const handlePlayerReady = useCallback((player: AsciinemaPlayer) => {
    playerInstanceRef.current = player;
  }, []);

  const handlePlayerDispose = useCallback(() => {
    playerInstanceRef.current = null;
  }, []);

  const handleExportCast = () => {
    const serialized = serializeAsciicast(data);
    triggerDownload(serialized, 'edited.cast');
  };

  const handleExportGif = async () => {
    const playerElement = playerContainerRef.current;
    const player = playerInstanceRef.current;
    if (!playerElement || !player) {
      return;
    }

    const duration = computeDuration(data);
    const gifData = await exportGif(playerElement, player, duration, {
      fps: gifFps,
      quality: gifQuality,
    });
    if (gifData) {
      triggerBlobDownload(gifData, 'recording.gif', 'image/gif');
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
          fontConfig={fontConfig}
          onPlayerReady={handlePlayerReady}
          onPlayerDispose={handlePlayerDispose}
        />
      </div>
      <div className="export-options">
        <button className="export-button" onClick={handleExportCast}>
          Download .cast
        </button>
        <div className="gif-controls" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ minWidth: '80px' }}>FPS: {gifFps}</span>
            <input
              type="range" min={1} max={30} value={gifFps}
              onChange={(e) => setGifFps(Number(e.target.value))}
              disabled={isExporting}
              style={{ flex: 1 }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ minWidth: '80px' }}>Quality: {gifQuality}</span>
            <input
              type="range" min={1} max={30} value={gifQuality}
              onChange={(e) => setGifQuality(Number(e.target.value))}
              disabled={isExporting}
              style={{ flex: 1 }}
            />
          </label>
          <span className="gif-frame-estimate">
            ~{Math.ceil(computeDuration(data) * gifFps)} frames
          </span>
        </div>
        <button
          className="export-button export-button-gif"
          onClick={handleExportGif}
          disabled={isExporting}
        >
          {isExporting
            ? `Exporting GIF... ${Math.round(progress * 100)}%`
            : 'Download Animated GIF'}
        </button>
        {isExporting && (
          <div className="export-progress">
            <div
              className="export-progress-bar"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
        {renderMp4Button()}
      </div>
    </div>
  );
}
