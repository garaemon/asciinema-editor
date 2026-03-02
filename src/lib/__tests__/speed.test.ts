import { describe, it, expect } from 'vitest';
import type { AsciicastData } from '../../types/asciicast';
import { applySpeedMultiplier, compressIdleTime } from '../speed';

function createTestData(events: [number, string, string][]): AsciicastData {
  return {
    header: { version: 2, width: 80, height: 24 },
    events: events.map(([t, type, data]) => [t, type as 'o' | 'i' | 'm' | 'r', data]),
  };
}

describe('applySpeedMultiplier', () => {
  it('should scale all event timestamps by the multiplier', () => {
    const data = createTestData([
      [1.0, 'o', 'hello'],
      [2.0, 'o', 'world'],
      [4.0, 'o', 'end'],
    ]);
    const result = applySpeedMultiplier(data, 2);
    expect(result.events).toEqual([
      [0.5, 'o', 'hello'],
      [1.0, 'o', 'world'],
      [2.0, 'o', 'end'],
    ]);
  });

  it('should slow down with multiplier < 1', () => {
    const data = createTestData([
      [1.0, 'o', 'a'],
      [2.0, 'o', 'b'],
    ]);
    const result = applySpeedMultiplier(data, 0.5);
    expect(result.events).toEqual([
      [2.0, 'o', 'a'],
      [4.0, 'o', 'b'],
    ]);
  });

  it('should keep timestamps at 0 unchanged', () => {
    const data = createTestData([
      [0, 'o', 'start'],
      [1.0, 'o', 'end'],
    ]);
    const result = applySpeedMultiplier(data, 2);
    expect(result.events).toEqual([
      [0, 'o', 'start'],
      [0.5, 'o', 'end'],
    ]);
  });

  it('should not mutate the original data', () => {
    const data = createTestData([
      [1.0, 'o', 'hello'],
      [2.0, 'o', 'world'],
    ]);
    const result = applySpeedMultiplier(data, 2);
    expect(data.events[0][0]).toBe(1.0);
    expect(result).not.toBe(data);
  });

  it('should preserve the header unchanged', () => {
    const data = createTestData([[1.0, 'o', 'hello']]);
    const result = applySpeedMultiplier(data, 2);
    expect(result.header).toEqual(data.header);
  });

  it('should handle empty events', () => {
    const data = createTestData([]);
    const result = applySpeedMultiplier(data, 2);
    expect(result.events).toEqual([]);
  });

  it('should throw for non-positive multiplier', () => {
    const data = createTestData([[1.0, 'o', 'a']]);
    expect(() => applySpeedMultiplier(data, 0)).toThrow();
    expect(() => applySpeedMultiplier(data, -1)).toThrow();
  });
});

describe('compressIdleTime', () => {
  it('should compress gaps exceeding the threshold', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
      [6.0, 'o', 'c'],
      [7.0, 'o', 'd'],
    ]);
    // Gap between b(1.0) and c(6.0) is 5s, exceeds 2s threshold
    const result = compressIdleTime(data, 2, 0.5);
    expect(result.events[0][0]).toBe(0.0);
    expect(result.events[1][0]).toBe(1.0);
    // 5s gap compressed to 0.5s: c = 1.0 + 0.5 = 1.5
    expect(result.events[2][0]).toBe(1.5);
    // d was 1s after c, so d = 1.5 + 1.0 = 2.5
    expect(result.events[3][0]).toBe(2.5);
  });

  it('should not compress gaps under the threshold', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [1.0, 'o', 'b'],
      [2.0, 'o', 'c'],
    ]);
    const result = compressIdleTime(data, 2, 0.5);
    expect(result.events).toEqual(data.events);
  });

  it('should compress multiple idle gaps', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [5.0, 'o', 'b'],
      [6.0, 'o', 'c'],
      [12.0, 'o', 'd'],
    ]);
    // Gap a->b: 5s (compress to 0.5s), gap c->d: 6s (compress to 0.5s)
    const result = compressIdleTime(data, 2, 0.5);
    expect(result.events[0][0]).toBe(0.0);
    // a->b: 5s compressed to 0.5s: b = 0.5
    expect(result.events[1][0]).toBe(0.5);
    // b->c: 1s (under threshold): c = 0.5 + 1.0 = 1.5
    expect(result.events[2][0]).toBe(1.5);
    // c->d: 6s compressed to 0.5s: d = 1.5 + 0.5 = 2.0
    expect(result.events[3][0]).toBe(2.0);
  });

  it('should not mutate the original data', () => {
    const data = createTestData([
      [0.0, 'o', 'a'],
      [5.0, 'o', 'b'],
    ]);
    const result = compressIdleTime(data, 2, 0.5);
    expect(data.events[0][0]).toBe(0.0);
    expect(data.events[1][0]).toBe(5.0);
    expect(result).not.toBe(data);
  });

  it('should handle empty events', () => {
    const data = createTestData([]);
    const result = compressIdleTime(data, 2, 0.5);
    expect(result.events).toEqual([]);
  });

  it('should handle single event', () => {
    const data = createTestData([[1.0, 'o', 'a']]);
    const result = compressIdleTime(data, 2, 0.5);
    expect(result.events).toEqual([[1.0, 'o', 'a']]);
  });

  it('should preserve the header unchanged', () => {
    const data = createTestData([[0.0, 'o', 'a'], [5.0, 'o', 'b']]);
    const result = compressIdleTime(data, 2, 0.5);
    expect(result.header).toEqual(data.header);
  });

  it('should throw for non-positive threshold', () => {
    const data = createTestData([[0.0, 'o', 'a']]);
    expect(() => compressIdleTime(data, 0, 0.5)).toThrow();
    expect(() => compressIdleTime(data, -1, 0.5)).toThrow();
  });

  it('should throw for negative compressed duration', () => {
    const data = createTestData([[0.0, 'o', 'a']]);
    expect(() => compressIdleTime(data, 2, -1)).toThrow();
  });
});
