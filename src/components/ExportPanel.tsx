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
  /** Pre-computed from data.events by App.tsx's computeTotalDuration to avoid duplicating the calculation logic. */
  duration: number;
}

type Mp4State = 'idle' | 'exporting' | 'error';

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

export function ExportPanel({ data, castContent, fontConfig, duration }: ExportPanelProps) {
  const [gifFps, setGifFps] = useState(10);
  const [gifQuality, setGifQuality] = useState(10);
  const [mp4State, setMp4State] = useState<Mp4State>('idle');
  const [mp4Progress, setMp4Progress] = useState(0);
  const [mp4Fps, setMp4Fps] = useState(15);
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
    const gifData = await exportGif(playerElement, player, duration, {
      fps: gifFps,
      quality: gifQuality,
    });
    if (gifData) {
      triggerBlobDownload(gifData, 'recording.gif', 'image/gif');
    }
  };

  const computeTotalDuration = (): number => {
    if (data.events.length === 0) {
      return 0;
    }
    return data.events[data.events.length - 1][0];
  };

  const handleExportMp4 = async () => {
    const playerElement = playerContainerRef.current;
    const player = playerInstanceRef.current;
    if (!playerElement || !player) {
      return;
    }

    setMp4State('exporting');
    setMp4Progress(0);
    try {
      const { captureAndEncodeMp4 } = await import('../lib/mp4-exporter');
      const mp4Data = await captureAndEncodeMp4(
        playerElement, player, computeTotalDuration(),
        { fps: mp4Fps, onProgress: setMp4Progress },
      );
      triggerBlobDownload(mp4Data, 'recording.mp4', 'video/mp4');
      setMp4State('idle');
    } catch {
      setMp4State('error');
    }
  };

  const renderMp4Controls = () => {
    const isActive = mp4State === 'exporting';
    return (
      <div className="mp4-controls">
        <label className="fps-label">
          FPS:
          <select
            value={mp4Fps}
            onChange={(e) => setMp4Fps(Number(e.target.value))}
            disabled={isActive}
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={24}>24</option>
            <option value={30}>30</option>
          </select>
        </label>
        <button
          className="export-button"
          onClick={handleExportMp4}
          disabled={isActive}
        >
          {isActive
            ? `Exporting MP4... ${Math.round(mp4Progress * 100)}%`
            : mp4State === 'error'
              ? 'Download MP4 (failed — retry)'
              : 'Download MP4'}
        </button>
      </div>
    );
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
            ~{Math.ceil(duration * gifFps)} frames
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
        {renderMp4Controls()}
      </div>
    </div>
  );
}
