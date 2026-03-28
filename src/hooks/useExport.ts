import { useState, useCallback, useRef } from 'react';
import type { Player } from 'asciinema-player';
import type { AnimatedGifOptions } from '../lib/gif-exporter';

export interface UseExportResult {
  /** True while an export is in progress. Updates reactively on each frame capture. */
  isExporting: boolean;
  /** Export progress from 0 to 1. Updates reactively as each frame is captured. */
  progress: number;
  /** Start a GIF export. Resolves with the encoded bytes after all frames are captured, or null if cancelled. */
  exportGif: (
    playerElement: HTMLElement,
    player: Player,
    duration: number,
    options?: AnimatedGifOptions,
  ) => Promise<Uint8Array | null>;
  /** Cancel an in-progress export. The pending exportGif call will resolve with null. */
  cancelExport: () => void;
}

/**
 * Orchestrate GIF/MP4 export with progress tracking and cancellation.
 *
 * `isExporting` and `progress` update reactively during export so the UI can
 * render a progress bar. `exportGif` returns a Promise that resolves only after
 * all frames are captured and encoded.
 *
 * @example
 * const { isExporting, progress, exportGif } = useExport();
 * const data = await exportGif(playerEl, player, duration, { fps: 10 });
 */
export function useExport(): UseExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const cancelledRef = useRef(false);

  const cancelExport = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  const exportGif = useCallback(
    async (
      playerElement: HTMLElement,
      player: Player,
      duration: number,
      options?: AnimatedGifOptions,
    ): Promise<Uint8Array | null> => {
      setIsExporting(true);
      setProgress(0);
      cancelledRef.current = false;
      try {
        const { captureAnimatedGif } = await import('../lib/gif-exporter');
        const result = await captureAnimatedGif(
          playerElement,
          player,
          duration,
          {
            ...options,
            onProgress: (p) => {
              setProgress(p);
              options?.onProgress?.(p);
            },
          },
        );
        if (cancelledRef.current) {
          return null;
        }
        return result;
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  return { isExporting, progress, exportGif, cancelExport };
}
