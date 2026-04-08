import { toPng } from 'html-to-image';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import type { Player } from 'asciinema-player';

export interface GifExportOptions {
  // Frames per second for the GIF (default: 10)
  fps: number;
  // Width of the output GIF in pixels (default: player's natural width)
  width?: number;
  // Quality 1-30, lower is better quality but slower (default: 10)
  quality: number;
}

export const DEFAULT_GIF_OPTIONS: GifExportOptions = {
  fps: 10,
  quality: 10,
};

export async function captureFrame(element: HTMLElement): Promise<HTMLImageElement> {
  const dataUrl = await toPng(element);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export async function renderFrameToCanvas(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
): Promise<ImageData> {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2d context');
  }
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function encodeGif(
  frames: ImageData[],
  width: number,
  height: number,
  options: GifExportOptions,
): Uint8Array {
  const gif = GIFEncoder();
  const delay = Math.round(1000 / options.fps);

  for (const frame of frames) {
    const palette = quantize(frame.data, 256);
    const index = applyPalette(frame.data, palette);
    gif.writeFrame(index, width, height, { palette, delay });
  }
  gif.finish();
  return gif.bytes();
}

export interface AnimatedGifOptions {
  fps?: number;
  quality?: number;
  width?: number;
  onProgress?: (progress: number) => void;
}

// Wait for a given number of milliseconds
function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Capture multiple frames by seeking through the recording
export async function captureAnimatedGif(
  playerElement: HTMLElement,
  player: Player,
  totalDuration: number,
  options?: AnimatedGifOptions,
): Promise<Uint8Array> {
  const fps = Math.max(1, options?.fps ?? 10);
  const quality = options?.quality ?? 10;
  const onProgress = options?.onProgress;

  // Play then immediately pause to dismiss the start overlay (play button
  // triangle) so it does not appear in captured frames.
  await player.play();
  await player.pause();

  const totalFrames = Math.max(1, Math.ceil(totalDuration * fps));
  const frames: ImageData[] = [];
  const canvas = document.createElement('canvas');

  // Seek and capture each frame
  for (let i = 0; i < totalFrames; i++) {
    const time = (i / fps);
    await player.seek(time);
    // Brief delay so the DOM re-renders after seeking
    await waitMs(80);

    const image = await captureFrame(playerElement);
    if (i === 0) {
      canvas.width = options?.width ?? image.naturalWidth;
      const scale = canvas.width / image.naturalWidth;
      canvas.height = Math.round(image.naturalHeight * scale);
    }
    const imageData = await renderFrameToCanvas(image, canvas);
    frames.push(imageData);

    onProgress?.((i + 1) / totalFrames);
  }

  return encodeGif(frames, canvas.width, canvas.height, { fps, quality });
}
