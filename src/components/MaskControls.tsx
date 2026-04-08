import { useState, useMemo } from 'react';
import type { AsciicastData } from '../types/asciicast';
import { maskEvents, maskText } from '../lib/masker';

interface MaskControlsProps {
  data: AsciicastData;
  onDataChange: (data: AsciicastData) => void;
}

function countMatches(data: AsciicastData, pattern: string | RegExp): number {
  let count = 0;
  for (const event of data.events) {
    if (event[1] !== 'o') {
      continue;
    }
    const text = event[2];
    // Count by replacing and comparing
    const replaced = maskText(text, pattern, '');
    if (replaced !== text) {
      const diff = text.length - replaced.length;
      // For string patterns, count occurrences based on length difference
      if (typeof pattern === 'string' && pattern.length > 0) {
        count += diff / pattern.length;
      } else {
        // For regex, count matches directly
        const matches = text.match(pattern instanceof RegExp ? pattern : new RegExp(pattern, 'g'));
        count += matches ? matches.length : 0;
      }
    }
  }
  return count;
}

function buildPattern(patternText: string, isRegex: boolean, isCaseInsensitive: boolean): string | RegExp {
  if (!isRegex) {
    return patternText;
  }
  const flags = isCaseInsensitive ? 'gi' : 'g';
  return new RegExp(patternText, flags);
}

export function MaskControls({ data, onDataChange }: MaskControlsProps) {
  const [patternText, setPatternText] = useState('');
  const [replacement, setReplacement] = useState('***');
  const [isRegex, setIsRegex] = useState(false);
  const [isCaseInsensitive, setIsCaseInsensitive] = useState(false);

  const matchCount = useMemo(() => {
    if (!patternText) {
      return 0;
    }
    try {
      const pattern = buildPattern(patternText, isRegex, isCaseInsensitive);
      return countMatches(data, pattern);
    } catch {
      return 0;
    }
  }, [data, patternText, isRegex, isCaseInsensitive]);

  const handleApply = () => {
    if (!patternText) {
      return;
    }
    try {
      const pattern = buildPattern(patternText, isRegex, isCaseInsensitive);
      const updated = maskEvents(data, pattern, replacement);
      onDataChange(updated);
      setPatternText('');
      setReplacement('***');
    } catch {
      // Invalid regex — do nothing
    }
  };

  return (
    <>
      <div className="control-group">
        <label htmlFor="mask-pattern">Search pattern</label>
        <input
          id="mask-pattern"
          type="text"
          value={patternText}
          onChange={(e) => setPatternText(e.target.value)}
          placeholder="Text to mask"
        />
      </div>
      <div className="control-group">
        <label htmlFor="mask-replacement">Replacement</label>
        <input
          id="mask-replacement"
          type="text"
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
        />
      </div>
      <div className="control-group">
        <label>
          <input
            type="checkbox"
            checked={isRegex}
            onChange={(e) => setIsRegex(e.target.checked)}
          />
          {' '}Regex
        </label>
        {isRegex && (
          <label>
            <input
              type="checkbox"
              checked={isCaseInsensitive}
              onChange={(e) => setIsCaseInsensitive(e.target.checked)}
            />
            {' '}Case insensitive
          </label>
        )}
      </div>
      {patternText && (
        <div className="control-group">
          <span>{matchCount} matches found</span>
        </div>
      )}
      <div className="control-group">
        <button onClick={handleApply} disabled={!patternText}>
          Apply Mask
        </button>
      </div>
    </>
  );
}
