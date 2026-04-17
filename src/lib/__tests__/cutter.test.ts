import { describe, it, expect } from 'vitest';
import type { AsciicastData } from '../../types/asciicast';
import { cutMiddle } from '../cutter';

function createTestData(events: [number, string, string][]): AsciicastData {
  return {
    header: { version: 2, width: 80, height: 24 },
    events: events.map(([t, type, data]) => [t, type as 'o' | 'i' | 'm' | 'r', data]),
  };
}

describe('cutMiddle', () => {
  it('should remove events inside the cut range', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
      [2.0, 'o', 'c'],
      [3.0, 'o', 'd'],
      [4.0, 'o', 'e'],
    ]);
    const result = cutMiddle(data, 1.5, 3.5);
    // b (1.0) kept, c (2.0) and d (3.0) removed, e (4.0) shifted by 2.0
    expect(result.events).toEqual([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
      [2.0, 'o', 'e'],
    ]);
  });

  it('should shift later events earlier by the cut duration', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [5.0, 'o', 'b'],
      [10.0, 'o', 'c'],
    ]);
    const result = cutMiddle(data, 2.0, 7.0);
    // a (0.0) kept, b (5.0) removed, c (10.0 - 5.0) = 5.0
    expect(result.events).toEqual([
      [0.0, 'o', 'a'],
      [5.0, 'o', 'c'],
    ]);
  });

  it('should remove events exactly at the range boundaries', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
      [2.0, 'o', 'c'],
      [3.0, 'o', 'd'],
    ]);
    const result = cutMiddle(data, 1.0, 2.0);
    // b (1.0) and c (2.0) removed, d (3.0) shifted by 1.0
    expect(result.events).toEqual([
      [0.0, 'o', 'a'],
      [2.0, 'o', 'd'],
    ]);
  });

  it('should return unchanged events when no events fall inside the range', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
      [5.0, 'o', 'c'],
    ]);
    const result = cutMiddle(data, 2.0, 4.0);
    // No event in [2.0, 4.0], but c is still shifted by (4.0 - 2.0) = 2.0
    expect(result.events).toEqual([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
      [3.0, 'o', 'c'],
    ]);
  });

  it('should return empty events when range covers the entire recording', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
      [2.0, 'o', 'c'],
    ]);
    const result = cutMiddle(data, 0.0, 5.0);
    expect(result.events).toEqual([]);
  });

  it('should handle empty events', () => {
    const data = createTestData([]);
    const result = cutMiddle(data, 1.0, 2.0);
    expect(result.events).toEqual([]);
  });

  it('should not mutate the original data', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
      [2.0, 'o', 'c'],
      [3.0, 'o', 'd'],
    ]);
    const result = cutMiddle(data, 1.0, 2.0);
    expect(data.events.length).toBe(4);
    expect(data.events[3][0]).toBe(3.0);
    expect(result).not.toBe(data);
    expect(result.events).not.toBe(data.events);
  });

  it('should preserve the header unchanged', () => {
    const data = createTestData([[1.0, 'o', 'a']]);
    const result = cutMiddle(data, 0.5, 0.75);
    expect(result.header).toEqual(data.header);
  });

  it('should throw when startTime is greater than endTime', () => {
    const data = createTestData([[0.0, 'o', 'a']]);
    expect(() => cutMiddle(data, 2.0, 1.0)).toThrow();
  });

  it('should throw when startTime equals endTime', () => {
    const data = createTestData([[0.0, 'o', 'a']]);
    expect(() => cutMiddle(data, 1.0, 1.0)).toThrow();
  });

  it('should throw for negative startTime', () => {
    const data = createTestData([[0.0, 'o', 'a']]);
    expect(() => cutMiddle(data, -1, 1.0)).toThrow();
  });

  it('should throw for negative endTime', () => {
    const data = createTestData([[0.0, 'o', 'a']]);
    expect(() => cutMiddle(data, 0, -1)).toThrow();
  });
});
