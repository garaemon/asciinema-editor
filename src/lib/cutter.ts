import type { AsciicastData, AsciicastEvent } from '../types/asciicast';

/**
 * Remove a middle time range `[startTime, endTime]` from an asciicast recording.
 *
 * Events within the range (inclusive on both ends) are dropped, and events
 * after `endTime` are shifted earlier by `(endTime - startTime)` so playback
 * remains continuous. The input is not mutated; a new `AsciicastData` is returned.
 *
 * @throws If `startTime` or `endTime` is negative, or if `startTime >= endTime`.
 */
export function cutMiddle(
  data: AsciicastData,
  startTime: number,
  endTime: number,
): AsciicastData {
  if (startTime < 0) {
    throw new Error(`Start time must be non-negative: ${startTime}`);
  }
  if (endTime < 0) {
    throw new Error(`End time must be non-negative: ${endTime}`);
  }
  if (startTime >= endTime) {
    throw new Error(
      `Start time must be less than end time: ${startTime} >= ${endTime}`,
    );
  }
  const cutDuration = endTime - startTime;
  const cutEvents: AsciicastEvent[] = data.events
    .filter(([time]) => time < startTime || time > endTime)
    .map(([time, type, eventData]) =>
      time > endTime
        ? [time - cutDuration, type, eventData]
        : [time, type, eventData],
    );
  return { header: data.header, events: cutEvents };
}
