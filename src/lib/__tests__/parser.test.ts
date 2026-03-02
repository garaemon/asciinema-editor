import { describe, it, expect } from 'vitest';
import { parseAsciicast } from '../parser';

const VALID_CAST = [
  '{"version": 2, "width": 80, "height": 24}',
  '[0.5, "o", "$ "]',
  '[1.0, "o", "hello\\r\\n"]',
  '[2.0, "i", "ls\\r\\n"]',
  '[3.0, "m", "marker"]',
  '[4.0, "r", "120x40"]',
].join('\n');

describe('parseAsciicast', () => {
  describe('valid v2 parsing', () => {
    it('should parse minimal valid cast', () => {
      const input = '{"version": 2, "width": 80, "height": 24}\n[0.5, "o", "$ "]';
      const result = parseAsciicast(input);
      expect(result.header.version).toBe(2);
      expect(result.header.width).toBe(80);
      expect(result.header.height).toBe(24);
      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual([0.5, 'o', '$ ']);
    });

    it('should parse all event types', () => {
      const result = parseAsciicast(VALID_CAST);
      expect(result.events).toHaveLength(5);
      expect(result.events[0][1]).toBe('o');
      expect(result.events[1][1]).toBe('o');
      expect(result.events[2][1]).toBe('i');
      expect(result.events[3][1]).toBe('m');
      expect(result.events[4][1]).toBe('r');
    });

    it('should parse header with optional fields', () => {
      const input = [
        '{"version": 2, "width": 80, "height": 24, "timestamp": 1504467315, "title": "Demo", "env": {"SHELL": "/bin/bash"}}',
        '[0.0, "o", "hi"]',
      ].join('\n');
      const result = parseAsciicast(input);
      expect(result.header.timestamp).toBe(1504467315);
      expect(result.header.title).toBe('Demo');
      expect(result.header.env?.SHELL).toBe('/bin/bash');
    });

    it('should handle cast with no events', () => {
      const input = '{"version": 2, "width": 80, "height": 24}';
      const result = parseAsciicast(input);
      expect(result.header.version).toBe(2);
      expect(result.events).toHaveLength(0);
    });

    it('should preserve event data with escape sequences', () => {
      const input = [
        '{"version": 2, "width": 80, "height": 24}',
        '[0.5, "o", "\\u001b[1;31mred\\u001b[0m"]',
      ].join('\n');
      const result = parseAsciicast(input);
      expect(result.events[0][2]).toBe('\u001b[1;31mred\u001b[0m');
    });
  });

  describe('header validation', () => {
    it('should throw on missing version', () => {
      const input = '{"width": 80, "height": 24}';
      expect(() => parseAsciicast(input)).toThrow();
    });

    it('should throw on wrong version', () => {
      const input = '{"version": 1, "width": 80, "height": 24}';
      expect(() => parseAsciicast(input)).toThrow();
    });

    it('should throw on missing width', () => {
      const input = '{"version": 2, "height": 24}';
      expect(() => parseAsciicast(input)).toThrow();
    });

    it('should throw on missing height', () => {
      const input = '{"version": 2, "width": 80}';
      expect(() => parseAsciicast(input)).toThrow();
    });

    it('should throw on non-integer width', () => {
      const input = '{"version": 2, "width": 80.5, "height": 24}';
      expect(() => parseAsciicast(input)).toThrow();
    });

    it('should throw on non-integer height', () => {
      const input = '{"version": 2, "width": 80, "height": 24.5}';
      expect(() => parseAsciicast(input)).toThrow();
    });

    it('should throw on zero width', () => {
      const input = '{"version": 2, "width": 0, "height": 24}';
      expect(() => parseAsciicast(input)).toThrow();
    });

    it('should throw on negative height', () => {
      const input = '{"version": 2, "width": 80, "height": -1}';
      expect(() => parseAsciicast(input)).toThrow();
    });
  });

  describe('malformed JSON', () => {
    it('should throw on empty string', () => {
      expect(() => parseAsciicast('')).toThrow();
    });

    it('should throw on invalid JSON header', () => {
      expect(() => parseAsciicast('{invalid json}')).toThrow();
    });

    it('should throw on invalid JSON event', () => {
      const input = [
        '{"version": 2, "width": 80, "height": 24}',
        'not json',
      ].join('\n');
      expect(() => parseAsciicast(input)).toThrow();
    });

    it('should throw on event with wrong structure', () => {
      const input = [
        '{"version": 2, "width": 80, "height": 24}',
        '["not_a_number", "o", "data"]',
      ].join('\n');
      expect(() => parseAsciicast(input)).toThrow();
    });

    it('should throw on event with invalid event type', () => {
      const input = [
        '{"version": 2, "width": 80, "height": 24}',
        '[0.5, "x", "data"]',
      ].join('\n');
      expect(() => parseAsciicast(input)).toThrow();
    });

    it('should throw on event with missing fields', () => {
      const input = [
        '{"version": 2, "width": 80, "height": 24}',
        '[0.5, "o"]',
      ].join('\n');
      expect(() => parseAsciicast(input)).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should skip empty lines', () => {
      const input = [
        '{"version": 2, "width": 80, "height": 24}',
        '',
        '[0.5, "o", "$ "]',
        '',
      ].join('\n');
      const result = parseAsciicast(input);
      expect(result.events).toHaveLength(1);
    });

    it('should handle trailing newline', () => {
      const input = '{"version": 2, "width": 80, "height": 24}\n[1.0, "o", "hi"]\n';
      const result = parseAsciicast(input);
      expect(result.events).toHaveLength(1);
    });

    it('should handle negative event time', () => {
      const input = [
        '{"version": 2, "width": 80, "height": 24}',
        '[0.5, "o", "$ "]',
        '[-1.0, "o", "bad"]',
      ].join('\n');
      expect(() => parseAsciicast(input)).toThrow();
    });

    it('should handle event with empty data string', () => {
      const input = [
        '{"version": 2, "width": 80, "height": 24}',
        '[0.5, "o", ""]',
      ].join('\n');
      const result = parseAsciicast(input);
      expect(result.events[0][2]).toBe('');
    });
  });
});
