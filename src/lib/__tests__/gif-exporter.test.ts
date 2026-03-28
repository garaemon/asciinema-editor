import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock html-to-image
const mockToPng = vi.fn().mockResolvedValue('data:image/png;base64,abc');
vi.mock('html-to-image', () => ({
  toPng: (...args: unknown[]) => mockToPng(...args),
}));

// Mock gifenc
const mockWriteFrame = vi.fn();
const mockFinish = vi.fn();
const mockBytes = vi.fn().mockReturnValue(new Uint8Array([71, 73, 70]));
const mockQuantize = vi.fn().mockReturnValue([[0, 0, 0], [255, 255, 255]]);
const mockApplyPalette = vi.fn().mockReturnValue(new Uint8Array([0, 1]));

vi.mock('gifenc', () => ({
  GIFEncoder: () => ({
    writeFrame: (...args: unknown[]) => mockWriteFrame(...args),
    finish: () => mockFinish(),
    bytes: () => mockBytes(),
  }),
  quantize: (...args: unknown[]) => mockQuantize(...args),
  applyPalette: (...args: unknown[]) => mockApplyPalette(...args),
}));

import {
  captureFrame,
  renderFrameToCanvas,
  encodeGif,
  captureAnimatedGif,
  DEFAULT_GIF_OPTIONS,
} from '../gif-exporter';
import type { GifExportOptions } from '../gif-exporter';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DEFAULT_GIF_OPTIONS', () => {
  it('should have expected default values', () => {
    expect(DEFAULT_GIF_OPTIONS).toEqual({ fps: 10, quality: 10 });
  });
});

describe('captureFrame', () => {
  it('should call toPng with the element', async () => {
    const element = document.createElement('div');
    // captureFrame creates an Image and waits for onload, which jsdom
    // does not fire for data URLs. Verify toPng is called correctly.
    const promise = captureFrame(element);

    expect(mockToPng).toHaveBeenCalledWith(element);

    // Clean up: prevent unhandled rejection by ignoring the pending promise
    promise.catch(() => {});
  });

  it('should reject when toPng fails', async () => {
    mockToPng.mockRejectedValueOnce(new Error('capture failed'));
    const element = document.createElement('div');

    await expect(captureFrame(element)).rejects.toThrow('capture failed');
  });
});

describe('renderFrameToCanvas', () => {
  it('should throw when canvas context is unavailable', async () => {
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue(null);

    const img = new Image();
    await expect(renderFrameToCanvas(img, canvas)).rejects.toThrow(
      'Failed to get canvas 2d context',
    );
  });

  it('should call drawImage and getImageData when context is available', async () => {
    const mockImageData = { data: new Uint8ClampedArray(16), width: 2, height: 2 };
    const mockCtx = {
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue(mockImageData),
    };
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    vi.spyOn(canvas, 'getContext').mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D);

    const img = new Image();
    const result = await renderFrameToCanvas(img, canvas);

    expect(mockCtx.drawImage).toHaveBeenCalledWith(img, 0, 0, 2, 2);
    expect(mockCtx.getImageData).toHaveBeenCalledWith(0, 0, 2, 2);
    expect(result).toBe(mockImageData);
  });
});

describe('encodeGif', () => {
  // jsdom lacks ImageData, so create a plain object matching the shape
  const makeFrame = (width: number, height: number) => {
    return {
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
    } as unknown as ImageData;
  };

  it('should encode a single frame and return bytes', () => {
    const frame = makeFrame(2, 2);
    const options: GifExportOptions = { fps: 10, quality: 10 };

    const result = encodeGif([frame], 2, 2, options);

    expect(mockQuantize).toHaveBeenCalledWith(frame.data, 256);
    expect(mockApplyPalette).toHaveBeenCalledWith(
      frame.data,
      [[0, 0, 0], [255, 255, 255]],
    );
    expect(mockWriteFrame).toHaveBeenCalledWith(
      new Uint8Array([0, 1]),
      2, 2,
      { palette: [[0, 0, 0], [255, 255, 255]], delay: 100 },
    );
    expect(mockFinish).toHaveBeenCalledOnce();
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('should encode multiple frames', () => {
    const frames = [makeFrame(4, 4), makeFrame(4, 4), makeFrame(4, 4)];
    const options: GifExportOptions = { fps: 5, quality: 10 };

    encodeGif(frames, 4, 4, options);

    expect(mockWriteFrame).toHaveBeenCalledTimes(3);
    // fps=5 => delay=200ms
    expect(mockWriteFrame.mock.calls[0][3]).toEqual(
      expect.objectContaining({ delay: 200 }),
    );
    expect(mockFinish).toHaveBeenCalledOnce();
  });

  it('should calculate delay from fps correctly', () => {
    const frame = makeFrame(1, 1);

    encodeGif([frame], 1, 1, { fps: 20, quality: 10 });

    expect(mockWriteFrame.mock.calls[0][3]).toEqual(
      expect.objectContaining({ delay: 50 }),
    );
  });
});

describe('captureAnimatedGif', () => {
  it('should seek through frames and report progress', async () => {
    // Mock canvas and context for renderFrameToCanvas
    const mockImageData = { data: new Uint8ClampedArray(16), width: 2, height: 2 };
    const mockCtx = {
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue(mockImageData),
    };
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        const canvas = {
          width: 0,
          height: 0,
          getContext: () => mockCtx,
        } as unknown as HTMLCanvasElement;
        return canvas;
      }
      return document.createElementNS('http://www.w3.org/1999/xhtml', tag) as HTMLElement;
    });

    // Mock toPng to return a data URL that loads an Image
    // (Image.onload won't fire in jsdom, so mock captureFrame via toPng)
    mockToPng.mockResolvedValue('data:image/png;base64,abc');

    const mockPlayer = {
      pause: vi.fn().mockResolvedValue(undefined),
      seek: vi.fn().mockResolvedValue(undefined),
    };

    const progressValues: number[] = [];

    // Duration 0.5s, fps 2 => 1 frame
    const promise = captureAnimatedGif(
      document.createElement('div'),
      mockPlayer as never,
      0.5,
      {
        fps: 2,
        quality: 10,
        onProgress: (p) => progressValues.push(p),
      },
    );

    // captureFrame creates an Image; since jsdom doesn't fire onload,
    // the promise will hang. We verify the player interactions instead.
    // Wait a tick to let the async loop start
    await vi.waitFor(() => {
      expect(mockPlayer.pause).toHaveBeenCalledOnce();
    });

    expect(mockPlayer.seek).toHaveBeenCalled();

    // Clean up
    promise.catch(() => {});
    vi.restoreAllMocks();
  });
});
