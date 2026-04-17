import { useCallback, useEffect } from 'react';

const DEFAULT_DEBOUNCE_MS = 1000;

export interface UseAutoSaveResult {
  clear: () => void;
}

/**
 * Persist a value to localStorage after a debounce delay.
 * Skips persisting when the value is null or undefined.
 * Returns a `clear` callback that removes the saved entry.
 */
export function useAutoSave<T>(
  value: T | null | undefined,
  storageKey: string,
  debounceMs: number = DEFAULT_DEBOUNCE_MS
): UseAutoSaveResult {
  useEffect(() => {
    if (value === null || value === undefined) {
      return;
    }
    const timerId = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(value));
      } catch {
        // Storage may be full or disabled; ignore so editing continues.
      }
    }, debounceMs);
    return () => clearTimeout(timerId);
  }, [value, storageKey, debounceMs]);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Storage may be disabled; nothing to do.
    }
  }, [storageKey]);

  return { clear };
}

/**
 * Load a previously-saved value from localStorage.
 * Returns null when the key is missing or the stored JSON is corrupt.
 */
export function loadSavedValue<T>(storageKey: string): T | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
