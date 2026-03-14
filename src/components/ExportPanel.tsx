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
  const handleExportCast = () => {
    const serialized = serializeAsciicast(data);
    triggerDownload(serialized, 'edited.cast');
  };

  return (
    <div className="export-panel">
      <h2>Export</h2>
      <div className="export-options">
        <button className="export-button" onClick={handleExportCast}>
          Download .cast
        </button>
        <p className="placeholder">GIF and MP4 export coming soon</p>
      </div>
    </div>
  );
}
