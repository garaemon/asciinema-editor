import { describe, it, expect } from 'vitest';
import { parseAsciicast } from '../parser';

const VALID_V2_CAST = [
  '{"version": 2, "width": 80, "height": 24}',
  '[0.5, "o", "$ "]',
  '[1.0, "o", "hello\\r\\n"]',
  '[2.0, "i", "ls\\r\\n"]',
  '[3.0, "m", "marker"]',
  '[4.0, "r", "120x40"]',
  '[5.0, "x", "0"]',
].join('\n');

const VALID_V3_CAST = [
  '{"version": 3, "term": {"cols": 80, "rows": 24, "type": "xterm-256color"}}',
  '[0.5, "o", "$ "]',
  '[0.5, "o", "hello\\r\\n"]',
  '[1.0, "i", "ls\\r\\n"]',
  '[1.0, "m", "marker"]',
  '[0.5, "x", "0"]',
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

    it('should parse all event types including exit', () => {
      const result = parseAsciicast(VALID_V2_CAST);
      expect(result.events).toHaveLength(6);
      expect(result.events[0][1]).toBe('o');
      expect(result.events[1][1]).toBe('o');
      expect(result.events[2][1]).toBe('i');
      expect(result.events[3][1]).toBe('m');
      expect(result.events[4][1]).toBe('r');
      expect(result.events[5][1]).toBe('x');
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

    it('should keep v2 timestamps as absolute', () => {
      const input = [
        '{"version": 2, "width": 80, "height": 24}',
        '[1.0, "o", "a"]',
        '[3.0, "o", "b"]',
        '[6.0, "o", "c"]',
      ].join('\n');
      const result = parseAsciicast(input);
      expect(result.events[0][0]).toBe(1.0);
      expect(result.events[1][0]).toBe(3.0);
      expect(result.events[2][0]).toBe(6.0);
    });
  });

  describe('valid v3 parsing', () => {
    it('should parse minimal v3 cast', () => {
      const input = [
        '{"version": 3, "term": {"cols": 120, "rows": 40}}',
        '[0.5, "o", "hello"]',
      ].join('\n');
      const result = parseAsciicast(input);
      expect(result.header.version).toBe(3);
      expect(result.header.width).toBe(120);
      expect(result.header.height).toBe(40);
      expect(result.events).toHaveLength(1);
    });

    it('should convert v3 relative timestamps to absolute', () => {
      const result = parseAsciicast(VALID_V3_CAST);
      // intervals: 0.5, 0.5, 1.0, 1.0, 0.5 -> absolute: 0.5, 1.0, 2.0, 3.0, 3.5
      expect(result.events[0][0]).toBeCloseTo(0.5);
      expect(result.events[1][0]).toBeCloseTo(1.0);
      expect(result.events[2][0]).toBeCloseTo(2.0);
      expect(result.events[3][0]).toBeCloseTo(3.0);
      expect(result.events[4][0]).toBeCloseTo(3.5);
    });

    it('should extract v3 header optional fields', () => {
      const input = [
        '{"version": 3, "term": {"cols": 80, "rows": 24, "type": "xterm-256color", "theme": {"fg": "#fff", "bg": "#000"}}, "title": "Demo", "tags": ["tutorial"], "timestamp": 123, "env": {"SHELL": "/bin/zsh"}}',
        '[0.1, "o", "hi"]',
      ].join('\n');
      const result = parseAsciicast(input);
      expect(result.header.title).toBe('Demo');
      expect(result.header.tags).toEqual(['tutorial']);
      expect(result.header.timestamp).toBe(123);
      expect(result.header.env?.SHELL).toBe('/bin/zsh');
      expect(result.header.theme?.fg).toBe('#fff');
      expect(result.header.term?.type).toBe('xterm-256color');
    });

    it('should skip comment lines', () => {
      const input = [
        '{"version": 3, "term": {"cols": 80, "rows": 24}}',
        '# this is a comment',
        '[0.5, "o", "hello"]',
        '# another comment',
        '[0.5, "o", "world"]',
      ].join('\n');
      const result = parseAsciicast(input);
      expect(result.events).toHaveLength(2);
      expect(result.events[0][0]).toBeCloseTo(0.5);
      expect(result.events[1][0]).toBeCloseTo(1.0);
    });

    it('should handle v3 with no events', () => {
      const input = '{"version": 3, "term": {"cols": 80, "rows": 24}}';
      const result = parseAsciicast(input);
      expect(result.events).toHaveLength(0);
    });

    it('should throw on v3 header missing term', () => {
      const input = '{"version": 3, "width": 80, "height": 24}';
      expect(() => parseAsciicast(input)).toThrow('Missing term');
    });

    it('should throw on v3 header missing term.cols', () => {
      const input = '{"version": 3, "term": {"rows": 24}}';
      expect(() => parseAsciicast(input)).toThrow('term.cols');
    });

    it('should throw on v3 header missing term.rows', () => {
      const input = '{"version": 3, "term": {"cols": 80}}';
      expect(() => parseAsciicast(input)).toThrow('term.rows');
    });
  });

  describe('header validation', () => {
    it('should throw on missing version', () => {
      const input = '{"width": 80, "height": 24}';
      expect(() => parseAsciicast(input)).toThrow();
    });

    it('should throw on unsupported version', () => {
      const input = '{"version": 1, "width": 80, "height": 24}';
      expect(() => parseAsciicast(input)).toThrow('Unsupported');
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
        '[0.5, "z", "data"]',
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

    it('should skip comment lines in v2 as well', () => {
      const input = [
        '{"version": 2, "width": 80, "height": 24}',
        '# comment',
        '[0.5, "o", "hello"]',
      ].join('\n');
      const result = parseAsciicast(input);
      expect(result.events).toHaveLength(1);
    });
  });
});
