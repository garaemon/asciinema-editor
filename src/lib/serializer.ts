import type { AsciicastData, AsciicastHeader } from '../types/asciicast';

function buildV2Header(header: AsciicastHeader): Record<string, unknown> {
  const result: Record<string, unknown> = {
    version: 2,
    width: header.width,
    height: header.height,
  };
  if (header.timestamp !== undefined) {
    result.timestamp = header.timestamp;
  }
  if (header.duration !== undefined) {
    result.duration = header.duration;
  }
  if (header.idle_time_limit !== undefined) {
    result.idle_time_limit = header.idle_time_limit;
  }
  if (header.command !== undefined) {
    result.command = header.command;
  }
  if (header.title !== undefined) {
    result.title = header.title;
  }
  if (header.env !== undefined) {
    result.env = header.env;
  }
  if (header.theme !== undefined) {
    result.theme = header.theme;
  }
  return result;
}

function buildV3Header(header: AsciicastHeader): Record<string, unknown> {
  const term: Record<string, unknown> = {
    cols: header.width,
    rows: header.height,
  };
  if (header.term?.type !== undefined) {
    term.type = header.term.type;
  }
  if (header.term?.version !== undefined) {
    term.version = header.term.version;
  }
  const result: Record<string, unknown> = {
    version: 3,
    term,
  };
  if (header.timestamp !== undefined) {
    result.timestamp = header.timestamp;
  }
  if (header.idle_time_limit !== undefined) {
    result.idle_time_limit = header.idle_time_limit;
  }
  if (header.command !== undefined) {
    result.command = header.command;
  }
  if (header.title !== undefined) {
    result.title = header.title;
  }
  if (header.env !== undefined) {
    result.env = header.env;
  }
  if (header.tags !== undefined) {
    result.tags = header.tags;
  }
  return result;
}

export function serializeAsciicast(data: AsciicastData): string {
  const headerObj = data.header.version === 3
    ? buildV3Header(data.header)
    : buildV2Header(data.header);
  const lines = [JSON.stringify(headerObj)];

  if (data.header.version === 3) {
    let previousAbsoluteTime = 0;
    for (const [time, type, eventData] of data.events) {
      const interval = time - previousAbsoluteTime;
      lines.push(JSON.stringify([interval, type, eventData]));
      previousAbsoluteTime = time;
    }
  } else {
    for (const event of data.events) {
      lines.push(JSON.stringify(event));
    }
  }

  return lines.join('\n');
}
