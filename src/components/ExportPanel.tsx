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
  const [gifWidth, setGifWidth] = useState(640);
  const [mp4Fps, setMp4Fps] = useState(15);
  const [mp4Width, setMp4Width] = useState(800);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<AsciinemaPlayer | null>(null);
  const { exportingFormat, progress, hasError, exportGif, exportMp4 } = useExport();
  const isExportingGif = exportingFormat === 'gif';
  const isExportingMp4 = exportingFormat === 'mp4';
  const isExporting = exportingFormat !== null;

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
      width: gifWidth,
    });
    if (gifData) {
      triggerBlobDownload(gifData, 'recording.gif', 'image/gif');
    }
  };

  const handleExportMp4 = async () => {
    const playerElement = playerContainerRef.current;
    const player = playerInstanceRef.current;
    if (!playerElement || !player) {
      return;
    }
    const mp4Data = await exportMp4(playerElement, player, duration, {
      fps: mp4Fps,
      width: mp4Width,
    });
    if (mp4Data) {
      triggerBlobDownload(mp4Data, 'recording.mp4', 'video/mp4');
    }
  };

  const renderMp4Controls = () => {
    return (
      <div className="mp4-controls" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ minWidth: '80px' }}>FPS: {mp4Fps}</span>
          <input
            type="range" min={1} max={30} value={mp4Fps}
            onChange={(e) => setMp4Fps(Number(e.target.value))}
            disabled={isExporting}
            style={{ flex: 1 }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ minWidth: '80px' }}>MP4 Width: {mp4Width}px</span>
          <input
            type="range" min={320} max={1920} step={80} value={mp4Width}
            onChange={(e) => setMp4Width(Number(e.target.value))}
            disabled={isExporting}
            style={{ flex: 1 }}
            aria-label="MP4 Width"
          />
        </label>
        <span className="mp4-frame-estimate">
          ~{Math.ceil(duration * mp4Fps)} frames
        </span>
        <button
          className="export-button"
          onClick={handleExportMp4}
          disabled={isExporting}
        >
          {isExportingMp4
            ? `Exporting MP4... ${Math.round(progress * 100)}%`
            : hasError
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
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ minWidth: '80px' }}>GIF Width: {gifWidth}px</span>
            <input
              type="range" min={320} max={1920} step={80} value={gifWidth}
              onChange={(e) => setGifWidth(Number(e.target.value))}
              disabled={isExporting}
              style={{ flex: 1 }}
              aria-label="GIF Width"
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
          {isExportingGif
            ? `Exporting GIF... ${Math.round(progress * 100)}%`
            : 'Download Animated GIF'}
        </button>
        {isExportingGif && (
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
