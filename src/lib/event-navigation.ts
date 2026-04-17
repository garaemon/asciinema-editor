import type { AsciicastEvent } from '../types/asciicast';

// A small epsilon makes the navigation robust against floating-point drift
// between the poller and event timestamps (both use seconds).
const TIME_EPSILON = 1e-6;

/**
 * Find the event that occurs strictly before the given time.
 * Returns null when there is no such event (empty list or at/before the first event).
 */
export function findPreviousEvent(
  events: AsciicastEvent[],
  currentTime: number,
): AsciicastEvent | null {
  let previous: AsciicastEvent | null = null;
  for (const event of events) {
    if (event[0] < currentTime - TIME_EPSILON) {
      previous = event;
    } else {
      break;
    }
  }
  return previous;
}

/**
 * Find the event that occurs strictly after the given time.
 * Returns null when there is no such event (empty list or at/after the last event).
 */
export function findNextEvent(
  events: AsciicastEvent[],
  currentTime: number,
): AsciicastEvent | null {
  for (const event of events) {
    if (event[0] > currentTime + TIME_EPSILON) {
      return event;
    }
  }
  return null;
}
