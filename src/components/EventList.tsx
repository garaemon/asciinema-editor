import { useState } from 'react';
import type { AsciicastData, AsciicastEvent, EventType } from '../types/asciicast';
import { stripAnsi } from '../lib/ansi';

interface EventListProps {
  data: AsciicastData;
  onDataChange: (data: AsciicastData) => void;
}

const BADGE_COLORS: Record<EventType, string> = {
  o: '#2a5a2a',
  i: '#2a4a6a',
  m: '#6a5a2a',
  r: '#5a2a5a',
  x: '#5a2a2a',
};

function formatTimestamp(seconds: number): string {
  return `${seconds.toFixed(3)}s`;
}

function buildUpdatedEvents(
  events: AsciicastEvent[],
  index: number,
  newText: string
): AsciicastEvent[] {
  return events.map((event, i) =>
    i === index ? [event[0], event[1], newText] : event
  );
}

interface EventRowProps {
  event: AsciicastEvent;
  index: number;
  onCommitEdit: (index: number, newText: string) => void;
}

function EventRow({ event, index, onCommitEdit }: EventRowProps) {
  const [timestamp, eventType, eventData] = event;
  const isOutput = eventType === 'o';
  const displayText = isOutput ? stripAnsi(eventData) : eventData;
  const [editValue, setEditValue] = useState(displayText);
  const [prevDisplayText, setPrevDisplayText] = useState(displayText);

  // Sync local state when props change (e.g., from undo/redo)
  if (displayText !== prevDisplayText) {
    setPrevDisplayText(displayText);
    setEditValue(displayText);
  }

  const handleBlur = () => {
    if (editValue !== displayText) {
      onCommitEdit(index, editValue);
    }
  };

  return (
    <div className="event-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <span className="event-timestamp" style={{ fontSize: 12, color: '#aaa', minWidth: 60, fontVariantNumeric: 'tabular-nums' }}>
        {formatTimestamp(timestamp)}
      </span>
      <span
        data-testid="event-type-badge"
        style={{
          fontSize: 11,
          padding: '1px 6px',
          borderRadius: 3,
          background: BADGE_COLORS[eventType],
          color: '#e0e0e0',
          fontWeight: 600,
          minWidth: 20,
          textAlign: 'center',
        }}
      >
        {eventType}
      </span>
      {isOutput ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          style={{
            flex: 1,
            background: '#0f0f1a',
            border: '1px solid #444',
            borderRadius: 3,
            color: '#e0e0e0',
            fontSize: 13,
            padding: '2px 6px',
            minWidth: 0,
          }}
        />
      ) : (
        <span style={{ fontSize: 13, color: '#888', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayText}
        </span>
      )}
    </div>
  );
}

export function EventList({ data, onDataChange }: EventListProps) {
  const handleCommitEdit = (index: number, newText: string) => {
    const updatedEvents = buildUpdatedEvents(data.events, index, newText);
    onDataChange({ ...data, events: updatedEvents });
  };

  return (
    <div className="event-list" style={{ overflowY: 'auto', maxHeight: 300, padding: '4px 0' }}>
      {data.events.map((event, index) => (
        <EventRow
          key={`${index}-${event[0]}`}
          event={event}
          index={index}
          onCommitEdit={handleCommitEdit}
        />
      ))}
    </div>
  );
}
