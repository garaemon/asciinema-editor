import { useState } from 'react';
import type { AsciicastData } from '../types/asciicast';
import { serializeAsciicast } from '../lib/serializer';

interface ExportPanelProps {
  data: AsciicastData;
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

export function ExportPanel({ data }: ExportPanelProps) {
  const [mp4Loading, setMp4Loading] = useState(false);
  const [mp4Progress, setMp4Progress] = useState(0);

  const handleExportCast = () => {
    const serialized = serializeAsciicast(data);
    triggerDownload(serialized, 'edited.cast');
  };

  const handleExportMp4 = async () => {
    setMp4Loading(true);
    setMp4Progress(0);
    try {
      const { loadFfmpeg } = await import('../lib/mp4-exporter');
      await loadFfmpeg((ratio) => setMp4Progress(ratio));
      // Full frame capture + encoding will be implemented when
      // the player element can be accessed from the export screen
      setMp4Loading(false);
    } catch {
      setMp4Loading(false);
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
          className="export-button"
          onClick={handleExportMp4}
          disabled={mp4Loading}
        >
          {mp4Loading
            ? `Loading ffmpeg... ${Math.round(mp4Progress * 100)}%`
            : 'Download MP4'}
        </button>
        <p className="placeholder">GIF export coming soon</p>
      </div>
    </div>
  );
}
