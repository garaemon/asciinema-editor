import { describe, it, expect } from 'vitest';
import type { AsciicastData } from '../../types/asciicast';
import { trimStart, trimEnd } from '../trimmer';

function createTestData(events: [number, string, string][]): AsciicastData {
  return {
    header: { version: 2, width: 80, height: 24 },
    events: events.map(([t, type, data]) => [t, type as 'o' | 'i' | 'm' | 'r', data]),
  };
}

describe('trimStart', () => {
  it('should remove events before the start time', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
      [2.0, 'o', 'c'],
      [3.0, 'o', 'd'],
    ]);
    const result = trimStart(data, 1.5);
    expect(result.events).toEqual([
      [0.5, 'o', 'c'],
      [1.5, 'o', 'd'],
    ]);
  });

  it('should adjust timestamps so the first kept event reflects offset from trim point', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [2.0, 'o', 'b'],
      [5.0, 'o', 'c'],
    ]);
    const result = trimStart(data, 1.0);
    // b at 2.0 - 1.0 = 1.0, c at 5.0 - 1.0 = 4.0
    expect(result.events).toEqual([
      [1.0, 'o', 'b'],
      [4.0, 'o', 'c'],
    ]);
  });

  it('should keep events exactly at the start time', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
      [2.0, 'o', 'c'],
    ]);
    const result = trimStart(data, 1.0);
    expect(result.events).toEqual([
      [0.0, 'o', 'b'],
      [1.0, 'o', 'c'],
    ]);
  });

  it('should return empty events when all events are before start time', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
    ]);
    const result = trimStart(data, 5.0);
    expect(result.events).toEqual([]);
  });

  it('should handle empty events', () => {
    const data = createTestData([]);
    const result = trimStart(data, 1.0);
    expect(result.events).toEqual([]);
  });

  it('should return all events when start time is 0', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
    ]);
    const result = trimStart(data, 0);
    expect(result.events).toEqual([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
    ]);
  });

  it('should not mutate the original data', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
      [2.0, 'o', 'c'],
    ]);
    const result = trimStart(data, 1.0);
    expect(data.events[0][0]).toBe(0.0);
    expect(data.events.length).toBe(3);
    expect(result).not.toBe(data);
  });

  it('should preserve the header unchanged', () => {
    const data = createTestData([[1.0, 'o', 'a']]);
    const result = trimStart(data, 0.5);
    expect(result.header).toEqual(data.header);
  });

  it('should throw for negative start time', () => {
    const data = createTestData([[0.0, 'o', 'a']]);
    expect(() => trimStart(data, -1)).toThrow();
  });
});

describe('trimEnd', () => {
  it('should remove events after the end time', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
      [2.0, 'o', 'c'],
      [3.0, 'o', 'd'],
    ]);
    const result = trimEnd(data, 2.5);
    expect(result.events).toEqual([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
      [2.0, 'o', 'c'],
    ]);
  });

  it('should keep events exactly at the end time', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
      [2.0, 'o', 'c'],
    ]);
    const result = trimEnd(data, 2.0);
    expect(result.events).toEqual([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
      [2.0, 'o', 'c'],
    ]);
  });

  it('should return empty events when end time is before all events', () => {
    const data = createTestData([
      [1.0, 'o', 'a'],
      [2.0, 'o', 'b'],
    ]);
    const result = trimEnd(data, 0.5);
    expect(result.events).toEqual([]);
  });

  it('should handle empty events', () => {
    const data = createTestData([]);
    const result = trimEnd(data, 1.0);
    expect(result.events).toEqual([]);
  });

  it('should not mutate the original data', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
      [2.0, 'o', 'c'],
    ]);
    const result = trimEnd(data, 1.5);
    expect(data.events.length).toBe(3);
    expect(result).not.toBe(data);
  });

  it('should preserve the header unchanged', () => {
    const data = createTestData([[1.0, 'o', 'a']]);
    const result = trimEnd(data, 2.0);
    expect(result.header).toEqual(data.header);
  });

  it('should not change timestamps', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
      [2.0, 'o', 'c'],
    ]);
    const result = trimEnd(data, 1.5);
    expect(result.events).toEqual([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
    ]);
  });

  it('should throw for negative end time', () => {
    const data = createTestData([[0.0, 'o', 'a']]);
    expect(() => trimEnd(data, -1)).toThrow();
  });
});
