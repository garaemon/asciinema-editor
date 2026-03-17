import { describe, it, expect } from 'vitest';
import { maskText, maskEvents } from '../masker';
import type { AsciicastData, AsciicastEvent } from '../../types/asciicast';

function createTestData(events: AsciicastEvent[]): AsciicastData {
  return {
    header: { version: 2, width: 80, height: 24 },
    events,
  };
}

describe('maskText', () => {
  it('should mask exact string match', () => {
    expect(maskText('my-password', 'my-password', '***')).toBe('***');
  });

  it('should mask multiple occurrences', () => {
    expect(maskText('abc abc', 'abc', '***')).toBe('*** ***');
  });

  it('should mask regex pattern', () => {
    expect(maskText('token=abc123', /token=\w+/, 'token=***')).toBe('token=***');
  });

  it('should return original text when no match', () => {
    expect(maskText('hello world', 'xyz', '***')).toBe('hello world');
  });

  it('should return empty string for empty text', () => {
    expect(maskText('', 'abc', '***')).toBe('');
  });

  it('should be case-sensitive by default', () => {
    expect(maskText('Password', 'password', '***')).toBe('Password');
  });
});

describe('maskEvents', () => {
  it('should mask output events', () => {
    const data = createTestData([[1.0, 'o', 'secret']]);
    const result = maskEvents(data, 'secret', '***');
    expect(result.events[0][2]).toBe('***');
  });

  it('should not modify input events', () => {
    const data = createTestData([[1.0, 'i', 'secret']]);
    const result = maskEvents(data, 'secret', '***');
    expect(result.events[0][2]).toBe('secret');
  });

  it('should not modify marker events', () => {
    const data = createTestData([[1.0, 'm', 'secret']]);
    const result = maskEvents(data, 'secret', '***');
    expect(result.events[0][2]).toBe('secret');
  });

  it('should not modify resize events', () => {
    const data = createTestData([[1.0, 'r', '120x40']]);
    const result = maskEvents(data, '120x40', '***');
    expect(result.events[0][2]).toBe('120x40');
  });

  it('should return new AsciicastData (immutable)', () => {
    const data = createTestData([[1.0, 'o', 'secret']]);
    const result = maskEvents(data, 'secret', '***');
    expect(result).not.toBe(data);
    expect(result.events).not.toBe(data.events);
  });

  it('should preserve header unchanged', () => {
    const data = createTestData([[1.0, 'o', 'secret']]);
    const result = maskEvents(data, 'secret', '***');
    expect(result.header).toBe(data.header);
  });

  it('should preserve event timestamps', () => {
    const data = createTestData([[2.5, 'o', 'secret']]);
    const result = maskEvents(data, 'secret', '***');
    expect(result.events[0][0]).toBe(2.5);
  });

  it('should work with regex pattern', () => {
    const data = createTestData([[1.0, 'o', 'token=abc123']]);
    const result = maskEvents(data, /token=\w+/, 'token=***');
    expect(result.events[0][2]).toBe('token=***');
  });

  it('should handle empty events array', () => {
    const data = createTestData([]);
    const result = maskEvents(data, 'secret', '***');
    expect(result.events).toEqual([]);
  });
});
