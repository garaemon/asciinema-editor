import { describe, it, expect } from 'vitest';
import type { AsciicastEvent } from '../../types/asciicast';
import { findPreviousEvent, findNextEvent } from '../event-navigation';

function createEvents(times: number[]): AsciicastEvent[] {
  return times.map((t) => [t, 'o', `data-${t}`]);
}

describe('findPreviousEvent', () => {
  it('should return null when events list is empty', () => {
    expect(findPreviousEvent([], 1.0)).toBeNull();
  });

  it('should return null when current time is before the first event', () => {
    const events = createEvents([1.0, 2.0, 3.0]);
    expect(findPreviousEvent(events, 0.5)).toBeNull();
  });

  it('should return null when current time equals the first event', () => {
    const events = createEvents([1.0, 2.0, 3.0]);
    expect(findPreviousEvent(events, 1.0)).toBeNull();
  });

  it('should return the previous event when current time is between events', () => {
    const events = createEvents([1.0, 2.0, 3.0]);
    expect(findPreviousEvent(events, 2.5)).toEqual([2.0, 'o', 'data-2']);
  });

  it('should return the event before the current one when current time matches an event', () => {
    const events = createEvents([1.0, 2.0, 3.0]);
    expect(findPreviousEvent(events, 2.0)).toEqual([1.0, 'o', 'data-1']);
  });

  it('should return the last event when current time is after all events', () => {
    const events = createEvents([1.0, 2.0, 3.0]);
    expect(findPreviousEvent(events, 5.0)).toEqual([3.0, 'o', 'data-3']);
  });
});

describe('findNextEvent', () => {
  it('should return null when events list is empty', () => {
    expect(findNextEvent([], 1.0)).toBeNull();
  });

  it('should return the first event when current time is before all events', () => {
    const events = createEvents([1.0, 2.0, 3.0]);
    expect(findNextEvent(events, 0.5)).toEqual([1.0, 'o', 'data-1']);
  });

  it('should return the next event when current time is between events', () => {
    const events = createEvents([1.0, 2.0, 3.0]);
    expect(findNextEvent(events, 1.5)).toEqual([2.0, 'o', 'data-2']);
  });

  it('should return the event after the current one when current time matches an event', () => {
    const events = createEvents([1.0, 2.0, 3.0]);
    expect(findNextEvent(events, 2.0)).toEqual([3.0, 'o', 'data-3']);
  });

  it('should return null when current time equals the last event', () => {
    const events = createEvents([1.0, 2.0, 3.0]);
    expect(findNextEvent(events, 3.0)).toBeNull();
  });

  it('should return null when current time is after all events', () => {
    const events = createEvents([1.0, 2.0, 3.0]);
    expect(findNextEvent(events, 5.0)).toBeNull();
  });
});
