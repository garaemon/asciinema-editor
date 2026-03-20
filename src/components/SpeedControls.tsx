import { useState } from 'react';
import type { AsciicastData } from '../types/asciicast';
import { applySpeedMultiplier, compressIdleTime } from '../lib/speed';

interface SpeedControlsProps {
  data: AsciicastData;
  onDataChange: (data: AsciicastData) => void;
}

export function SpeedControls({ data, onDataChange }: SpeedControlsProps) {
  const [multiplier, setMultiplier] = useState(1.0);
  const [idleThreshold, setIdleThreshold] = useState(2.0);
  const [compressedDuration, setCompressedDuration] = useState(0.5);
  const [previousData, setPreviousData] = useState(data);

  // Reset input values when data changes (e.g. undo/redo)
  if (data !== previousData) {
    setPreviousData(data);
    setMultiplier(1.0);
    setIdleThreshold(2.0);
    setCompressedDuration(0.5);
  }

  const handleApplySpeed = () => {
    if (multiplier <= 0) {
      return;
    }
    const updated = applySpeedMultiplier(data, multiplier);
    onDataChange(updated);
  };

  const handleCompressIdle = () => {
    if (idleThreshold <= 0 || compressedDuration < 0) {
      return;
    }
    const updated = compressIdleTime(data, idleThreshold, compressedDuration);
    onDataChange(updated);
  };

  return (
    <>
      <div className="control-group">
        <label htmlFor="speed-multiplier">Speed multiplier</label>
        <div className="control-row">
          <input
            id="speed-multiplier"
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            value={multiplier}
            onChange={(e) => setMultiplier(parseFloat(e.target.value) || 1)}
          />
          <button onClick={handleApplySpeed}>Apply</button>
        </div>
      </div>
      <div className="control-group">
        <span className="control-group-title">Idle compression</span>
        <label htmlFor="idle-threshold">Threshold (s)</label>
        <input
          id="idle-threshold"
          type="number"
          min="0.1"
          step="0.1"
          value={idleThreshold}
          onChange={(e) => setIdleThreshold(parseFloat(e.target.value) || 2)}
        />
        <label htmlFor="compressed-duration">Compress to (s)</label>
        <div className="control-row">
          <input
            id="compressed-duration"
            type="number"
            min="0"
            step="0.1"
            value={compressedDuration}
            onChange={(e) => setCompressedDuration(parseFloat(e.target.value) || 0)}
          />
          <button onClick={handleCompressIdle}>Compress</button>
        </div>
      </div>
    </>
  );
}
