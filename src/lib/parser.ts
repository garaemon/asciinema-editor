import type {
  AsciicastHeader,
  AsciicastEvent,
  AsciicastData,
  EventType,
} from '../types/asciicast';

const VALID_EVENT_TYPES: ReadonlySet<string> = new Set(['o', 'i', 'm', 'r']);

function validateHeader(header: Record<string, unknown>): AsciicastHeader {
  if (header.version !== 2) {
    throw new Error('Invalid asciicast version: expected 2');
  }
  if (typeof header.width !== 'number' || !Number.isInteger(header.width) || header.width <= 0) {
    throw new Error(`Invalid width: ${header.width}`);
  }
  if (typeof header.height !== 'number' || !Number.isInteger(header.height) || header.height <= 0) {
    throw new Error(`Invalid height: ${header.height}`);
  }
  return header as unknown as AsciicastHeader;
}

function validateEvent(parsed: unknown, lineNumber: number): AsciicastEvent {
  if (!Array.isArray(parsed) || parsed.length < 3) {
    throw new Error(`Invalid event at line ${lineNumber}: expected [time, type, data]`);
  }
  const [time, eventType, data] = parsed;
  if (typeof time !== 'number' || time < 0) {
    throw new Error(`Invalid event time at line ${lineNumber}: ${time}`);
  }
  if (typeof eventType !== 'string' || !VALID_EVENT_TYPES.has(eventType)) {
    throw new Error(`Invalid event type at line ${lineNumber}: ${eventType}`);
  }
  if (typeof data !== 'string') {
    throw new Error(`Invalid event data at line ${lineNumber}: expected string`);
  }
  return [time, eventType as EventType, data];
}

export function parseAsciicast(input: string): AsciicastData {
  const lines = input.split('\n');
  const nonEmptyLines = lines.filter((line) => line.trim() !== '');

  if (nonEmptyLines.length === 0) {
    throw new Error('Empty asciicast file');
  }

  let headerObj: Record<string, unknown>;
  try {
    headerObj = JSON.parse(nonEmptyLines[0]);
  } catch {
    throw new Error('Invalid JSON in asciicast header');
  }

  const header = validateHeader(headerObj);
  const events: AsciicastEvent[] = [];

  for (let i = 1; i < nonEmptyLines.length; i++) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(nonEmptyLines[i]);
    } catch {
      throw new Error(`Invalid JSON at line ${i + 1}`);
    }
    events.push(validateEvent(parsed, i + 1));
  }

  return { header, events };
}
