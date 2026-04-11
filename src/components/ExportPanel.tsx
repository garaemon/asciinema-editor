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

type ExportFormatOption = 'cast' | 'gif' | 'mp4';

export function ExportPanel({ data, castContent, fontConfig, duration }: ExportPanelProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormatOption>('gif');
  const [fps, setFps] = useState(10);
  const [width, setWidth] = useState(640);
  const [gifQuality, setGifQuality] = useState(10);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<AsciinemaPlayer | null>(null);
  const { exportingFormat, progress, hasError, exportGif, exportMp4 } = useExport();
  const isExporting = exportingFormat !== null;
  const showMediaSettings = selectedFormat !== 'cast';

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
      fps,
      quality: gifQuality,
      width,
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
      fps,
      width,
    });
    if (mp4Data) {
      triggerBlobDownload(mp4Data, 'recording.mp4', 'video/mp4');
    }
  };

  const handleDownload = () => {
    if (selectedFormat === 'cast') {
      handleExportCast();
    } else if (selectedFormat === 'gif') {
      handleExportGif();
    } else {
      handleExportMp4();
    }
  };

  const buildButtonLabel = (): string => {
    if (isExporting) {
      const format = exportingFormat === 'gif' ? 'GIF' : 'MP4';
      return `Exporting ${format}... ${Math.round(progress * 100)}%`;
    }
    if (hasError) {
      return 'Download (retry)';
    }
    return 'Download';
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
      <div className="export-settings">
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ minWidth: '100px' }}>Format</span>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as ExportFormatOption)}
            disabled={isExporting}
            style={{ flex: 1 }}
            aria-label="Format"
          >
            <option value="cast">Asciicast (.cast)</option>
            <option value="gif">Animated GIF</option>
            <option value="mp4">MP4 Video</option>
          </select>
        </label>
        {showMediaSettings && (
          <>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ minWidth: '100px' }}>FPS: {fps}</span>
              <input
                type="range" min={1} max={30} value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                disabled={isExporting}
                style={{ flex: 1 }}
                aria-label="FPS"
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ minWidth: '100px' }}>Width: {width}px</span>
              <input
                type="range" min={320} max={1920} step={80} value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                disabled={isExporting}
                style={{ flex: 1 }}
                aria-label="Width"
              />
            </label>
            {selectedFormat === 'gif' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ minWidth: '100px' }}>Quality: {gifQuality}</span>
                <input
                  type="range" min={1} max={30} value={gifQuality}
                  onChange={(e) => setGifQuality(Number(e.target.value))}
                  disabled={isExporting}
                  style={{ flex: 1 }}
                  aria-label="Quality"
                />
              </label>
            )}
            <span className="frame-estimate">~{Math.ceil(duration * fps)} frames</span>
          </>
        )}
      </div>
      {isExporting && (
        <div className="export-progress-section">
          <div className="export-progress">
            <div
              className="export-progress-bar"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}
      <div className="export-buttons">
        <button
          className="export-button"
          onClick={handleDownload}
          disabled={isExporting}
        >
          {buildButtonLabel()}
        </button>
      </div>
    </div>
  );
}
