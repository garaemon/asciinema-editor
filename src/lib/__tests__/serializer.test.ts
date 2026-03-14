import { describe, it, expect } from 'vitest';
import { serializeAsciicast } from '../serializer';
import { parseAsciicast } from '../parser';
import type { AsciicastData } from '../../types/asciicast';

describe('serializeAsciicast', () => {
  it('should serialize v2 data to NDJSON format', () => {
    const data: AsciicastData = {
      header: { version: 2, width: 80, height: 24 },
      events: [
        [0.5, 'o', 'hello'],
        [1.0, 'o', ' world'],
      ],
    };
    const result = serializeAsciicast(data);
    const lines = result.split('\n');
    expect(lines).toHaveLength(3);
    expect(JSON.parse(lines[0])).toEqual({ version: 2, width: 80, height: 24 });
    expect(JSON.parse(lines[1])).toEqual([0.5, 'o', 'hello']);
    expect(JSON.parse(lines[2])).toEqual([1.0, 'o', ' world']);
  });

  it('should preserve optional header fields', () => {
    const data: AsciicastData = {
      header: {
        version: 2,
        width: 120,
        height: 40,
        timestamp: 1504467315,
        title: 'demo',
        env: { SHELL: '/bin/bash', TERM: 'xterm-256color' },
      },
      events: [],
    };
    const result = serializeAsciicast(data);
    const header = JSON.parse(result);
    expect(header.timestamp).toBe(1504467315);
    expect(header.title).toBe('demo');
    expect(header.env).toEqual({ SHELL: '/bin/bash', TERM: 'xterm-256color' });
  });

  it('should handle empty events', () => {
    const data: AsciicastData = {
      header: { version: 2, width: 80, height: 24 },
      events: [],
    };
    const result = serializeAsciicast(data);
    const lines = result.split('\n');
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toEqual({ version: 2, width: 80, height: 24 });
  });

  it('should handle all event types', () => {
    const data: AsciicastData = {
      header: { version: 2, width: 80, height: 24 },
      events: [
        [0.0, 'o', 'output'],
        [0.5, 'i', 'input'],
        [1.0, 'm', 'marker'],
        [1.5, 'r', '100x50'],
      ],
    };
    const result = serializeAsciicast(data);
    const lines = result.split('\n');
    expect(lines).toHaveLength(5);
    expect(JSON.parse(lines[1])[1]).toBe('o');
    expect(JSON.parse(lines[2])[1]).toBe('i');
    expect(JSON.parse(lines[3])[1]).toBe('m');
    expect(JSON.parse(lines[4])[1]).toBe('r');
  });

  it('should preserve escape sequences in event data', () => {
    const data: AsciicastData = {
      header: { version: 2, width: 80, height: 24 },
      events: [
        [0.0, 'o', '\u001b[1;31mHello\u001b[0m\r\n'],
      ],
    };
    const result = serializeAsciicast(data);
    const lines = result.split('\n');
    const event = JSON.parse(lines[1]);
    expect(event[2]).toBe('\u001b[1;31mHello\u001b[0m\r\n');
  });

  it('should round-trip parse -> serialize -> parse', () => {
    const input = [
      '{"version": 2, "width": 80, "height": 24}',
      '[0.5, "o", "hello"]',
      '[1.0, "o", " world"]',
      '[2.5, "i", "ls\\r\\n"]',
    ].join('\n');
    const parsed = parseAsciicast(input);
    const serialized = serializeAsciicast(parsed);
    const reparsed = parseAsciicast(serialized);
    expect(reparsed.header.version).toBe(parsed.header.version);
    expect(reparsed.header.width).toBe(parsed.header.width);
    expect(reparsed.header.height).toBe(parsed.header.height);
    expect(reparsed.events).toEqual(parsed.events);
  });

  it('should serialize v3 header with term object', () => {
    const data: AsciicastData = {
      header: {
        version: 3,
        width: 100,
        height: 50,
        term: { type: 'xterm-256color', version: '1.0' },
        tags: ['demo', 'test'],
      },
      events: [
        [0.5, 'o', 'hello'],
      ],
    };
    const result = serializeAsciicast(data);
    const lines = result.split('\n');
    const header = JSON.parse(lines[0]);
    expect(header.version).toBe(3);
    expect(header.term.cols).toBe(100);
    expect(header.term.rows).toBe(50);
    expect(header.term.type).toBe('xterm-256color');
    expect(header.tags).toEqual(['demo', 'test']);
  });

  it('should convert v3 absolute timestamps back to relative', () => {
    const data: AsciicastData = {
      header: { version: 3, width: 80, height: 24 },
      events: [
        [0.5, 'o', 'a'],
        [1.2, 'o', 'b'],
        [3.0, 'o', 'c'],
      ],
    };
    const result = serializeAsciicast(data);
    const lines = result.split('\n');
    const event1 = JSON.parse(lines[1]);
    const event2 = JSON.parse(lines[2]);
    const event3 = JSON.parse(lines[3]);
    expect(event1[0]).toBeCloseTo(0.5);
    expect(event2[0]).toBeCloseTo(0.7);
    expect(event3[0]).toBeCloseTo(1.8);
  });
});
