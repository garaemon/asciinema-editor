import type { AsciicastData, AsciicastEvent } from '../types/asciicast';

export function trimStart(
  data: AsciicastData,
  startTime: number,
): AsciicastData {
  if (startTime < 0) {
    throw new Error(`Start time must be non-negative: ${startTime}`);
  }
  const trimmedEvents: AsciicastEvent[] = data.events
    .filter(([time]) => time >= startTime)
    .map(([time, type, eventData]) => [time - startTime, type, eventData]);
  return { header: data.header, events: trimmedEvents };
}

export function trimEnd(
  data: AsciicastData,
  endTime: number,
): AsciicastData {
  if (endTime < 0) {
    throw new Error(`End time must be non-negative: ${endTime}`);
  }
  const trimmedEvents: AsciicastEvent[] = data.events
    .filter(([time]) => time <= endTime)
    .map(([time, type, eventData]) => [time, type, eventData]);
  return { header: data.header, events: trimmedEvents };
}
