import { toPng } from 'html-to-image';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

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
