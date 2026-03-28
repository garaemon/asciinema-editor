import { useState, useCallback, useRef } from 'react';
import type { Player } from 'asciinema-player';
import type { AnimatedGifOptions } from '../lib/gif-exporter';

export interface UseExportResult {
  isExporting: boolean;
  progress: number;
  exportGif: (
    playerElement: HTMLElement,
    player: Player,
    duration: number,
    options?: AnimatedGifOptions,
  ) => Promise<Uint8Array | null>;
  cancelExport: () => void;
}
/**
 * Orchestrate GIF/MP4 export with progress tracking and cancellation.
 *
 * @example
 * const { isExporting, progress, exportGif } = useExport();
 * // isExporting and progress update reactively during export.
 * // exportGif resolves with the final data only after all frames are captured.
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
