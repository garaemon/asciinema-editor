import { useState } from 'react';
import type { AsciicastData } from '../types/asciicast';
import { serializeAsciicast } from '../lib/serializer';

interface ExportPanelProps {
  data: AsciicastData;
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

export function ExportPanel({ data }: ExportPanelProps) {
  const [mp4State, setMp4State] = useState<Mp4State>('idle');
  const [mp4Progress, setMp4Progress] = useState(0);

  const handleExportCast = () => {
    const serialized = serializeAsciicast(data);
    triggerDownload(serialized, 'edited.cast');
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
      <div className="export-options">
        <button className="export-button" onClick={handleExportCast}>
          Download .cast
        </button>
        {renderMp4Button()}
        <button className="export-button" disabled>
          Download GIF (coming soon)
        </button>
      </div>
    </div>
  );
}
