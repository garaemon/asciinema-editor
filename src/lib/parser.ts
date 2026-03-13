import type {
  AsciicastHeader,
  AsciicastEvent,
  AsciicastData,
  EventType,
} from '../types/asciicast';

// "x" is a v3 event type but also appears in some v2 recordings
const VALID_EVENT_TYPES: ReadonlySet<string> = new Set(['o', 'i', 'm', 'r', 'x']);

function validatePositiveInteger(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid ${name}: ${value}`);
  }
  return value;
}

function validateV2Header(header: Record<string, unknown>): AsciicastHeader {
  return {
    ...header,
    version: 2,
    width: validatePositiveInteger(header.width, 'width'),
    height: validatePositiveInteger(header.height, 'height'),
  } as AsciicastHeader;
}

function validateV3Header(header: Record<string, unknown>): AsciicastHeader {
  const term = header.term;
  if (!term || typeof term !== 'object') {
    throw new Error('Missing term object in v3 header');
  }
  const termObj = term as Record<string, unknown>;
  const cols = validatePositiveInteger(termObj.cols, 'term.cols');
  const rows = validatePositiveInteger(termObj.rows, 'term.rows');
  const termTheme = termObj.theme as Record<string, string> | undefined;

  return {
    version: 3,
    width: cols,
    height: rows,
    timestamp: typeof header.timestamp === 'number' ? header.timestamp : undefined,
    idle_time_limit: typeof header.idle_time_limit === 'number' ? header.idle_time_limit : undefined,
    command: typeof header.command === 'string' ? header.command : undefined,
    title: typeof header.title === 'string' ? header.title : undefined,
    env: isStringRecord(header.env) ? header.env : undefined,
    theme: termTheme ? extractTheme(termTheme) : undefined,
    tags: Array.isArray(header.tags) ? (header.tags as string[]) : undefined,
    term: {
      type: typeof termObj.type === 'string' ? termObj.type : undefined,
      version: typeof termObj.version === 'string' ? termObj.version : undefined,
    },
  };
}

function extractTheme(obj: Record<string, unknown>): AsciicastHeader['theme'] {
  return {
    fg: typeof obj.fg === 'string' ? obj.fg : undefined,
    bg: typeof obj.bg === 'string' ? obj.bg : undefined,
    palette: typeof obj.palette === 'string' ? obj.palette : undefined,
  };
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateHeader(header: Record<string, unknown>): AsciicastHeader {
  const version = header.version;
  if (version === 2) return validateV2Header(header);
  if (version === 3) return validateV3Header(header);
  throw new Error(`Unsupported asciicast version: ${version}`);
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

function convertRelativeToAbsolute(events: AsciicastEvent[]): AsciicastEvent[] {
  let absoluteTime = 0;
  return events.map(([interval, type, data]) => {
    absoluteTime += interval;
    return [absoluteTime, type, data];
  });
}

function filterContentLines(lines: string[]): string[] {
  return lines.filter((line) => {
    const trimmed = line.trim();
    return trimmed !== '' && !trimmed.startsWith('#');
  });
}

export function parseAsciicast(input: string): AsciicastData {
  const lines = input.split('\n');
  const contentLines = filterContentLines(lines);

  if (contentLines.length === 0) {
    throw new Error('Empty asciicast file');
  }

  let headerObj: Record<string, unknown>;
  try {
    headerObj = JSON.parse(contentLines[0]);
  } catch {
    throw new Error('Invalid JSON in asciicast header');
  }

  const header = validateHeader(headerObj);
  const events: AsciicastEvent[] = [];

  for (let i = 1; i < contentLines.length; i++) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(contentLines[i]);
    } catch {
      throw new Error(`Invalid JSON at line ${i + 1}`);
    }
    events.push(validateEvent(parsed, i + 1));
  }

  if (header.version === 3) {
    return { header, events: convertRelativeToAbsolute(events) };
  }
  return { header, events };
}
