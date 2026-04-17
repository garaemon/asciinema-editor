import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAutoSave, loadSavedValue } from '../useAutoSave';

const STORAGE_KEY = 'asciinema-editor:v1:test';

describe('useAutoSave', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  it('should save value to localStorage after debounce delay', () => {
    const value = { foo: 'bar' };
    renderHook(() => useAutoSave(value, STORAGE_KEY));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(value));
  });

  it('should not save when value is null', () => {
    renderHook(() => useAutoSave(null, STORAGE_KEY));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('should debounce rapid value changes', () => {
    const { rerender } = renderHook(
      ({ value }) => useAutoSave(value, STORAGE_KEY),
      { initialProps: { value: { n: 1 } } }
    );
    rerender({ value: { n: 2 } });
    rerender({ value: { n: 3 } });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify({ n: 3 }));
  });

  it('should clear storage when clear() is called', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
    const { result } = renderHook(() => useAutoSave({ foo: 'baz' }, STORAGE_KEY));
    act(() => {
      result.current.clear();
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('loadSavedValue', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return parsed value when valid JSON exists', () => {
    const stored = { foo: 'bar' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    expect(loadSavedValue(STORAGE_KEY)).toEqual(stored);
  });

  it('should return null when no value exists', () => {
    expect(loadSavedValue(STORAGE_KEY)).toBeNull();
  });

  it('should return null and not throw when JSON is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    expect(loadSavedValue(STORAGE_KEY)).toBeNull();
  });
});
