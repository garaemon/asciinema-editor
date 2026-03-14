import { useState } from 'react';
import type { AsciicastData } from '../types/asciicast';
import { trimStart, trimEnd } from '../lib/trimmer';

interface TrimControlsProps {
  data: AsciicastData;
  onDataChange: (data: AsciicastData) => void;
}

function computeMaxTime(data: AsciicastData): number {
  if (data.events.length === 0) {
    return 0;
  }
  return data.events[data.events.length - 1][0];
}

export function TrimControls({ data, onDataChange }: TrimControlsProps) {
  const [startTime, setStartTime] = useState(0);
  const maxTime = computeMaxTime(data);
  const [endTime, setEndTime] = useState(maxTime);

  const handleTrimStart = () => {
    if (startTime < 0) {
      return;
    }
    const updated = trimStart(data, startTime);
    onDataChange(updated);
    setStartTime(0);
  };

  const handleTrimEnd = () => {
    const effectiveEnd = endTime > 0 ? endTime : maxTime;
    if (effectiveEnd < 0) {
      return;
    }
    const updated = trimEnd(data, effectiveEnd);
    onDataChange(updated);
    setEndTime(0);
  };

  return (
    <>
      <div className="control-group">
        <label htmlFor="trim-start">Trim start (s)</label>
        <div className="control-row">
          <input
            id="trim-start"
            type="number"
            min="0"
            step="0.1"
            value={startTime}
            onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
          />
          <button onClick={handleTrimStart}>Trim</button>
        </div>
      </div>
      <div className="control-group">
        <label htmlFor="trim-end">
          Trim end (s) — max: {maxTime.toFixed(1)}
        </label>
        <div className="control-row">
          <input
            id="trim-end"
            type="number"
            min="0"
            step="0.1"
            value={endTime}
            onChange={(e) => setEndTime(parseFloat(e.target.value) || 0)}
          />
          <button onClick={handleTrimEnd}>Trim</button>
        </div>
      </div>
    </>
  );
}
