import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useHistory } from '../useHistory';

describe('useHistory', () => {
  const initial = { value: 'a' };
  const second = { value: 'b' };
  const third = { value: 'c' };

  it('should return initial state with no undo/redo available', () => {
    const { result } = renderHook(() => useHistory(initial));
    expect(result.current.current).toBe(initial);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should enable undo after push', () => {
    const { result } = renderHook(() => useHistory(initial));
    act(() => {
      result.current.push(second);
    });
    expect(result.current.current).toBe(second);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should restore previous value on undo', () => {
    const { result } = renderHook(() => useHistory(initial));
    act(() => {
      result.current.push(second);
    });
    act(() => {
      result.current.undo();
    });
    expect(result.current.current).toBe(initial);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('should restore undone value on redo', () => {
    const { result } = renderHook(() => useHistory(initial));
    act(() => {
      result.current.push(second);
    });
    act(() => {
      result.current.undo();
    });
    act(() => {
      result.current.redo();
    });
    expect(result.current.current).toBe(second);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should navigate back through multiple entries', () => {
    const { result } = renderHook(() => useHistory(initial));
    act(() => {
      result.current.push(second);
    });
    act(() => {
      result.current.push(third);
    });
    act(() => {
      result.current.undo();
    });
    expect(result.current.current).toBe(second);
    act(() => {
      result.current.undo();
    });
    expect(result.current.current).toBe(initial);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('should clear redo stack on push after undo', () => {
    const { result } = renderHook(() => useHistory(initial));
    act(() => {
      result.current.push(second);
    });
    act(() => {
      result.current.push(third);
    });
    act(() => {
      result.current.undo();
    });
    act(() => {
      result.current.push({ value: 'd' });
    });
    expect(result.current.canRedo).toBe(false);
    expect(result.current.current).toEqual({ value: 'd' });
  });

  it('should be a no-op when undoing at bottom of stack', () => {
    const { result } = renderHook(() => useHistory(initial));
    act(() => {
      result.current.undo();
    });
    expect(result.current.current).toBe(initial);
    expect(result.current.canUndo).toBe(false);
  });

  it('should be a no-op when redoing at top of stack', () => {
    const { result } = renderHook(() => useHistory(initial));
    act(() => {
      result.current.push(second);
    });
    act(() => {
      result.current.redo();
    });
    expect(result.current.current).toBe(second);
    expect(result.current.canRedo).toBe(false);
  });

  describe('reset', () => {
    it('should set new value and clear all history', () => {
      const { result } = renderHook(() => useHistory(initial));
      act(() => {
        result.current.push(second);
        result.current.push(third);
      });
      act(() => {
        result.current.reset({ value: 'fresh' });
      });
      expect(result.current.current).toEqual({ value: 'fresh' });
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('should not allow undo back to null initial value', () => {
      const { result } = renderHook(() => useHistory<{ value: string } | null>(null));
      act(() => {
        result.current.reset({ value: 'loaded' });
      });
      expect(result.current.current).toEqual({ value: 'loaded' });
      expect(result.current.canUndo).toBe(false);
      act(() => {
        result.current.push({ value: 'edited' });
      });
      act(() => {
        result.current.undo();
      });
      expect(result.current.current).toEqual({ value: 'loaded' });
      expect(result.current.canUndo).toBe(false);
    });
  });
});
