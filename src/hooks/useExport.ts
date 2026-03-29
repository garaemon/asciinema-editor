import { useState, useCallback, useRef } from 'react';
import type { Player } from 'asciinema-player';
import type { AnimatedGifOptions } from '../lib/gif-exporter';

export type ExportFormat = 'gif' | 'mp4';

export interface UseExportResult {
  /** Which format is currently exporting, or null if idle. */
  exportingFormat: ExportFormat | null;
  /** Export progress from 0 to 1. Updates reactively as each frame is captured. */
  progress: number;
  /** True when the last export failed. Resets on the next export call. */
  hasError: boolean;
  /** Start a GIF export. Resolves with the encoded bytes after all frames are captured, or null if cancelled. */
  exportGif: (
    playerElement: HTMLElement,
    player: Player,
    duration: number,
    options?: AnimatedGifOptions,
  ) => Promise<Uint8Array | null>;
  /** Start an MP4 export. Resolves with the encoded bytes, or null on failure. */
  exportMp4: (
    playerElement: HTMLElement,
    player: Player,
    duration: number,
    options?: { fps?: number; width?: number },
  ) => Promise<Uint8Array | null>;
  /** Cancel an in-progress export. The pending export call will resolve with null. */
  cancelExport: () => void;
}

/**
 * Orchestrate GIF/MP4 export with progress tracking and cancellation.
 *
 * `exportingFormat` and `progress` update reactively during export so the UI
 * can render a progress bar for the active format. Export functions return a
 * Promise that resolves only after all frames are captured and encoded.
 *
 * @example
 * const { exportingFormat, progress, exportGif, exportMp4 } = useExport();
 * const data = await exportGif(playerEl, player, duration, { fps: 10 });
 */
export function useExport(): UseExportResult {
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
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
      setExportingFormat('gif');
      setProgress(0);
      setHasError(false);
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
      } catch {
        setHasError(true);
        return null;
      } finally {
        setExportingFormat(null);
      }
    },
    [],
  );

  const exportMp4 = useCallback(
    async (
      playerElement: HTMLElement,
      player: Player,
      duration: number,
      options?: { fps?: number; width?: number },
    ): Promise<Uint8Array | null> => {
      setExportingFormat('mp4');
      setProgress(0);
      setHasError(false);
      cancelledRef.current = false;
      try {
        const { captureAndEncodeMp4 } = await import('../lib/mp4-exporter');
        const result = await captureAndEncodeMp4(
          playerElement,
          player,
          duration,
          {
            ...options,
            onProgress: (p) => {
              setProgress(p);
            },
          },
        );
        if (cancelledRef.current) {
          return null;
        }
        return result;
      } catch {
        setHasError(true);
        return null;
      } finally {
        setExportingFormat(null);
      }
    },
    [],
  );

  return { exportingFormat, progress, hasError, exportGif, exportMp4, cancelExport };
}
