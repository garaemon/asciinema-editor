import { useEffect, useRef } from 'react';

export interface KeyboardShortcutCallbacks {
  onPlayPause?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

function isEditableTarget(element: Element | null): boolean {
  if (!element) {
    return false;
  }
  const tagName = element.tagName;
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return true;
  }
  if (element instanceof HTMLElement && element.isContentEditable) {
    return true;
  }
  // Fallback for environments (e.g., jsdom) where isContentEditable does not
  // reflect the contenteditable attribute.
  const contentEditableAttr = element.getAttribute('contenteditable');
  if (contentEditableAttr !== null && contentEditableAttr !== 'false') {
    return true;
  }
  return false;
}

function matchesRedo(event: KeyboardEvent): boolean {
  const hasModifier = event.ctrlKey || event.metaKey;
  if (!hasModifier) {
    return false;
  }
  if (event.shiftKey && event.key.toLowerCase() === 'z') {
    return true;
  }
  // Ctrl+Y is a common redo shortcut on Windows/Linux.
  if (!event.shiftKey && event.key.toLowerCase() === 'y') {
    return true;
  }
  return false;
}

function matchesUndo(event: KeyboardEvent): boolean {
  const hasModifier = event.ctrlKey || event.metaKey;
  return hasModifier && !event.shiftKey && event.key.toLowerCase() === 'z';
}

function matchesPlayPause(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }
  // Ignore auto-repeat so holding Space does not toggle play/pause rapidly.
  if (event.repeat) {
    return false;
  }
  return event.key === ' ' || event.code === 'Space';
}

/**
 * Attaches a document-level keydown listener to handle global shortcuts.
 * Ignores events dispatched while the user is typing in an input, textarea,
 * or contentEditable element so shortcuts do not interfere with text entry.
 */
export function useKeyboardShortcuts(callbacks: KeyboardShortcutCallbacks): void {
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (isEditableTarget(document.activeElement)) {
        return;
      }
      // Redo must be checked before undo because Ctrl+Shift+Z shares the 'z' key.
      if (matchesRedo(event)) {
        event.preventDefault();
        callbacksRef.current.onRedo?.();
        return;
      }
      if (matchesUndo(event)) {
        event.preventDefault();
        callbacksRef.current.onUndo?.();
        return;
      }
      if (matchesPlayPause(event)) {
        event.preventDefault();
        callbacksRef.current.onPlayPause?.();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
