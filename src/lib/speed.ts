import type { AsciicastData, AsciicastEvent } from '../types/asciicast';

export function applySpeedMultiplier(
  data: AsciicastData,
  multiplier: number,
): AsciicastData {
  if (multiplier <= 0) {
    throw new Error(`Speed multiplier must be positive: ${multiplier}`);
  }
  const scaledEvents: AsciicastEvent[] = data.events.map(
    ([time, type, eventData]) => [time / multiplier, type, eventData],
  );
  return { header: data.header, events: scaledEvents };
}

export function compressIdleTime(
  data: AsciicastData,
  threshold: number,
  compressedDuration: number,
): AsciicastData {
  if (threshold <= 0) {
    throw new Error(`Threshold must be positive: ${threshold}`);
  }
  if (compressedDuration < 0) {
    throw new Error(`Compressed duration must be non-negative: ${compressedDuration}`);
  }
  if (data.events.length === 0) {
    return { header: data.header, events: [] };
  }

  const compressedEvents: AsciicastEvent[] = [
    [data.events[0][0], data.events[0][1], data.events[0][2]],
  ];
  let totalReduction = 0;

  for (let i = 1; i < data.events.length; i++) {
    const gap = data.events[i][0] - data.events[i - 1][0];
    if (gap > threshold) {
      totalReduction += gap - compressedDuration;
    }
    const adjustedTime = data.events[i][0] - totalReduction;
    compressedEvents.push([adjustedTime, data.events[i][1], data.events[i][2]]);
  }

  return { header: data.header, events: compressedEvents };
}
