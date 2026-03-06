import { describe, it, expect } from 'vitest';
import type {
  AsciicastHeader,
  AsciicastEvent,
  AsciicastData,
  EventType,
} from '../asciicast';

describe('Asciicast types', () => {
  it('should allow valid v2 header with required fields only', () => {
    const header: AsciicastHeader = {
      version: 2,
      width: 80,
      height: 24,
    };
    expect(header.version).toBe(2);
    expect(header.width).toBe(80);
    expect(header.height).toBe(24);
  });

  it('should allow v2 header with optional fields', () => {
    const header: AsciicastHeader = {
      version: 2,
      width: 120,
      height: 40,
      timestamp: 1504467315,
      duration: 10.5,
      idle_time_limit: 2,
      command: '/bin/bash',
      title: 'Demo',
      env: { SHELL: '/bin/bash', TERM: 'xterm-256color' },
      theme: { fg: '#ffffff', bg: '#000000', palette: '#000000:#aa0000' },
    };
    expect(header.title).toBe('Demo');
    expect(header.env?.SHELL).toBe('/bin/bash');
  });

  it('should allow v3 header with term and tags', () => {
    const header: AsciicastHeader = {
      version: 3,
      width: 80,
      height: 24,
      tags: ['demo', 'tutorial'],
      term: { type: 'xterm-256color', version: '1.0' },
    };
    expect(header.version).toBe(3);
    expect(header.tags).toEqual(['demo', 'tutorial']);
    expect(header.term?.type).toBe('xterm-256color');
  });

  it('should allow valid output event', () => {
    const event: AsciicastEvent = [0.248848, 'o', 'Hello World'];
    expect(event[0]).toBe(0.248848);
    expect(event[1]).toBe('o');
    expect(event[2]).toBe('Hello World');
  });

  it('should allow all event types including exit', () => {
    const eventTypes: EventType[] = ['o', 'i', 'm', 'r', 'x'];
    expect(eventTypes).toHaveLength(5);
  });

  it('should allow valid AsciicastData', () => {
    const data: AsciicastData = {
      header: { version: 2, width: 80, height: 24 },
      events: [
        [0.0, 'o', '$ '],
        [1.0, 'i', 'ls\r\n'],
        [1.5, 'o', 'file1.txt\r\n'],
        [3.0, 'm', 'end'],
        [4.0, 'x', '0'],
      ],
    };
    expect(data.header.version).toBe(2);
    expect(data.events).toHaveLength(5);
  });
});
