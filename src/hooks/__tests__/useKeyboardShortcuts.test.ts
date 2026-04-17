import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

interface ShortcutCallbacks {
  onPlayPause: ReturnType<typeof vi.fn>;
  onUndo: ReturnType<typeof vi.fn>;
  onRedo: ReturnType<typeof vi.fn>;
}

function createCallbacks(): ShortcutCallbacks {
  return {
    onPlayPause: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
  };
}

function dispatchKey(init: KeyboardEventInit): void {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  document.dispatchEvent(event);
}

describe('useKeyboardShortcuts', () => {
  let focusedElement: HTMLElement | null = null;

  beforeEach(() => {
    focusedElement = null;
  });

  afterEach(() => {
    if (focusedElement && focusedElement.parentNode) {
      focusedElement.parentNode.removeChild(focusedElement);
    }
    focusedElement = null;
  });

  it('should call onPlayPause when Space is pressed', () => {
    const callbacks = createCallbacks();
    renderHook(() => useKeyboardShortcuts(callbacks));
    dispatchKey({ key: ' ', code: 'Space' });
    expect(callbacks.onPlayPause).toHaveBeenCalledTimes(1);
  });

  it('should call onUndo when Ctrl+Z is pressed', () => {
    const callbacks = createCallbacks();
    renderHook(() => useKeyboardShortcuts(callbacks));
    dispatchKey({ key: 'z', ctrlKey: true });
    expect(callbacks.onUndo).toHaveBeenCalledTimes(1);
    expect(callbacks.onRedo).not.toHaveBeenCalled();
  });

  it('should call onUndo when Cmd+Z is pressed', () => {
    const callbacks = createCallbacks();
    renderHook(() => useKeyboardShortcuts(callbacks));
    dispatchKey({ key: 'z', metaKey: true });
    expect(callbacks.onUndo).toHaveBeenCalledTimes(1);
  });

  it('should call onRedo when Ctrl+Shift+Z is pressed', () => {
    const callbacks = createCallbacks();
    renderHook(() => useKeyboardShortcuts(callbacks));
    dispatchKey({ key: 'Z', ctrlKey: true, shiftKey: true });
    expect(callbacks.onRedo).toHaveBeenCalledTimes(1);
    expect(callbacks.onUndo).not.toHaveBeenCalled();
  });

  it('should call onRedo when Cmd+Shift+Z is pressed', () => {
    const callbacks = createCallbacks();
    renderHook(() => useKeyboardShortcuts(callbacks));
    dispatchKey({ key: 'Z', metaKey: true, shiftKey: true });
    expect(callbacks.onRedo).toHaveBeenCalledTimes(1);
  });

  it('should call onRedo when Ctrl+Y is pressed', () => {
    const callbacks = createCallbacks();
    renderHook(() => useKeyboardShortcuts(callbacks));
    dispatchKey({ key: 'y', ctrlKey: true });
    expect(callbacks.onRedo).toHaveBeenCalledTimes(1);
  });

  it('should not fire shortcuts when focus is inside an input element', () => {
    const callbacks = createCallbacks();
    renderHook(() => useKeyboardShortcuts(callbacks));
    const input = document.createElement('input');
    document.body.appendChild(input);
    focusedElement = input;
    input.focus();
    dispatchKey({ key: ' ', code: 'Space' });
    dispatchKey({ key: 'z', ctrlKey: true });
    dispatchKey({ key: 'y', ctrlKey: true });
    expect(callbacks.onPlayPause).not.toHaveBeenCalled();
    expect(callbacks.onUndo).not.toHaveBeenCalled();
    expect(callbacks.onRedo).not.toHaveBeenCalled();
  });

  it('should not fire shortcuts when focus is inside a textarea element', () => {
    const callbacks = createCallbacks();
    renderHook(() => useKeyboardShortcuts(callbacks));
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    focusedElement = textarea;
    textarea.focus();
    dispatchKey({ key: ' ', code: 'Space' });
    expect(callbacks.onPlayPause).not.toHaveBeenCalled();
  });

  it('should not fire shortcuts when focus is inside a contentEditable element', () => {
    const callbacks = createCallbacks();
    renderHook(() => useKeyboardShortcuts(callbacks));
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    document.body.appendChild(editable);
    focusedElement = editable;
    editable.focus();
    dispatchKey({ key: ' ', code: 'Space' });
    expect(callbacks.onPlayPause).not.toHaveBeenCalled();
  });

  it('should prevent default when Space is handled', () => {
    const callbacks = createCallbacks();
    renderHook(() => useKeyboardShortcuts(callbacks));
    const event = new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('should ignore auto-repeat Space events to avoid rapid play/pause toggling', () => {
    const callbacks = createCallbacks();
    renderHook(() => useKeyboardShortcuts(callbacks));
    dispatchKey({ key: ' ', code: 'Space', repeat: true });
    expect(callbacks.onPlayPause).not.toHaveBeenCalled();
  });

  it('should detach listener on unmount', () => {
    const callbacks = createCallbacks();
    const { unmount } = renderHook(() => useKeyboardShortcuts(callbacks));
    unmount();
    dispatchKey({ key: ' ', code: 'Space' });
    expect(callbacks.onPlayPause).not.toHaveBeenCalled();
  });
});
