import type { AsciicastData, AsciicastEvent } from '../types/asciicast';

export function maskText(text: string, pattern: string | RegExp, replacement: string): string {
  if (typeof pattern === 'string') {
    return text.replaceAll(pattern, replacement);
  }
  // Ensure global flag for regex to replace all occurrences
  const globalRegex = pattern.global ? pattern : new RegExp(pattern.source, pattern.flags + 'g');
  return text.replace(globalRegex, replacement);
}

export function maskEvents(data: AsciicastData, pattern: string | RegExp, replacement: string): AsciicastData {
  const maskedEvents: AsciicastEvent[] = data.events.map((event) => {
    const [time, type, eventData] = event;
    // Only mask output events
    if (type !== 'o') {
      return event;
    }
    const maskedData = maskText(eventData, pattern, replacement);
    if (maskedData === eventData) {
      return event; // No change, return original reference
    }
    return [time, type, maskedData];
  });
  return {
    header: data.header,
    events: maskedEvents,
  };
}
