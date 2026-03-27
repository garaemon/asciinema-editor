import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { toPng } from 'html-to-image';

export interface Mp4ExportOptions {
  fps: number;
  // Output width (height is calculated from aspect ratio)
  width: number;
}

export const DEFAULT_MP4_OPTIONS: Mp4ExportOptions = {
  fps: 15,
  width: 800,
};

let ffmpegInstance: FFmpeg | null = null;

// Reset cached instance (for testing)
export function resetFfmpegInstance(): void {
  ffmpegInstance = null;
}

// Lazy-load ffmpeg.wasm (~25MB) only when needed
export async function loadFfmpeg(onProgress?: (ratio: number) => void): Promise<FFmpeg> {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }
  const ffmpeg = new FFmpeg();
  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => onProgress(progress));
  }
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

// Encode PNG frames into an MP4 video
export async function encodeMp4(
  ffmpeg: FFmpeg,
  frames: Uint8Array[],
  options: Mp4ExportOptions,
): Promise<Uint8Array> {
  // Write frames as sequential PNG files
  for (let i = 0; i < frames.length; i++) {
    const filename = `frame${String(i).padStart(5, '0')}.png`;
    await ffmpeg.writeFile(filename, frames[i]);
  }

  await ffmpeg.exec([
    '-framerate', String(options.fps),
    '-i', 'frame%05d.png',
    '-vf', `scale=${options.width}:-2`,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-y',
    'output.mp4',
  ]);

  const outputData = await ffmpeg.readFile('output.mp4');

  // Cleanup temporary files from ffmpeg's virtual filesystem
  for (let i = 0; i < frames.length; i++) {
    const filename = `frame${String(i).padStart(5, '0')}.png`;
    await ffmpeg.deleteFile(filename);
  }
  await ffmpeg.deleteFile('output.mp4');

  if (typeof outputData === 'string') {
    throw new Error('Unexpected string output from ffmpeg');
  }
  return outputData;
}

// Convert a data URL to Uint8Array
function convertDataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Capture a single frame from an HTML element as PNG bytes
export async function captureFrameAsPng(element: HTMLElement): Promise<Uint8Array> {
  const dataUrl = await toPng(element);
  return convertDataUrlToBytes(dataUrl);
}

// Wait for DOM to settle after a player seek
function waitForRender(ms = 80): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Capture all frames from a player and encode as MP4
export async function captureAndEncodeMp4(
  playerElement: HTMLElement,
  player: { seek: (time: number) => void; pause: () => void },
  totalDuration: number,
  options?: {
    fps?: number;
    width?: number;
    onProgress?: (progress: number) => void;
  },
): Promise<Uint8Array> {
  const fps = options?.fps ?? 30;
  const width = options?.width ?? 800;
  const onProgress = options?.onProgress;

  onProgress?.(0);

  // Phase 1: Load ffmpeg (0 - 0.1)
  const ffmpeg = await loadFfmpeg((ratio) => {
    onProgress?.(ratio * 0.1);
  });
  onProgress?.(0.1);

  // Phase 2: Capture frames (0.1 - 0.8)
  player.pause();
  const totalFrames = Math.max(1, Math.ceil(totalDuration * fps));
  const frames: Uint8Array[] = [];

  for (let i = 0; i < totalFrames; i++) {
    const seekTime = i / fps;
    player.seek(seekTime);
    await waitForRender();
    const frameData = await captureFrameAsPng(playerElement);
    frames.push(frameData);
    onProgress?.(0.1 + (0.7 * (i + 1)) / totalFrames);
  }

  // Phase 3: Encode (0.8 - 1.0)
  onProgress?.(0.8);
  const mp4Options: Mp4ExportOptions = { fps, width };
  const mp4Data = await encodeMp4(ffmpeg, frames, mp4Options);
  onProgress?.(1.0);

  return mp4Data;
}
