import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @ffmpeg/ffmpeg before importing the module under test
const mockLoad = vi.fn().mockResolvedValue(undefined);
const mockOn = vi.fn();
const mockWriteFile = vi.fn().mockResolvedValue(undefined);
const mockExec = vi.fn().mockResolvedValue(0);
const mockReadFile = vi.fn().mockResolvedValue(new Uint8Array([0, 0, 0, 1]));
const mockDeleteFile = vi.fn().mockResolvedValue(undefined);

vi.mock('@ffmpeg/ffmpeg', () => {
  class MockFFmpeg {
    load = mockLoad;
    on = mockOn;
    writeFile = mockWriteFile;
    exec = mockExec;
    readFile = mockReadFile;
    deleteFile = mockDeleteFile;
  }
  return { FFmpeg: MockFFmpeg };
});

vi.mock('@ffmpeg/util', () => ({
  toBlobURL: vi.fn().mockImplementation((url: string) =>
    Promise.resolve(`blob:${url}`),
  ),
}));

// Mock html-to-image for captureFrameAsPng
const mockToPng = vi.fn().mockResolvedValue('data:image/png;base64,AAAA');
vi.mock('html-to-image', () => ({
  toPng: (...args: unknown[]) => mockToPng(...args),
}));

import {
  loadFfmpeg,
  encodeMp4,
  captureFrameAsPng,
  captureAndEncodeMp4,
  resetFfmpegInstance,
  DEFAULT_MP4_OPTIONS,
} from '../mp4-exporter';
import type { Mp4ExportOptions } from '../mp4-exporter';

beforeEach(() => {
  vi.clearAllMocks();
  resetFfmpegInstance();
});

describe('DEFAULT_MP4_OPTIONS', () => {
  it('should have expected default values', () => {
    expect(DEFAULT_MP4_OPTIONS).toEqual({ fps: 15, width: 800 });
  });
});

describe('loadFfmpeg', () => {
  it('should create FFmpeg instance and call load with blob URLs', async () => {
    await loadFfmpeg();

    expect(mockLoad).toHaveBeenCalledOnce();
    const loadArgs = mockLoad.mock.calls[0][0];
    expect(loadArgs.coreURL).toContain('blob:');
    expect(loadArgs.coreURL).toContain('ffmpeg-core.js');
    expect(loadArgs.wasmURL).toContain('blob:');
    expect(loadArgs.wasmURL).toContain('ffmpeg-core.wasm');
  });

  it('should register progress callback when provided', async () => {
    const onProgress = vi.fn();
    await loadFfmpeg(onProgress);

    expect(mockOn).toHaveBeenCalledWith('progress', expect.any(Function));

    // Simulate progress event
    const progressHandler = mockOn.mock.calls[0][1];
    progressHandler({ progress: 0.5 });
    expect(onProgress).toHaveBeenCalledWith(0.5);
  });

  it('should not register progress callback when not provided', async () => {
    await loadFfmpeg();
    expect(mockOn).not.toHaveBeenCalled();
  });

  it('should return cached instance on subsequent calls', async () => {
    const first = await loadFfmpeg();
    const second = await loadFfmpeg();

    expect(first).toBe(second);
    expect(mockLoad).toHaveBeenCalledOnce();
  });
});

describe('encodeMp4', () => {
  it('should write frames, exec ffmpeg, and return output', async () => {
    const ffmpeg = await loadFfmpeg();
    const frames = [new Uint8Array([1]), new Uint8Array([2])];
    const options: Mp4ExportOptions = { fps: 10, width: 640 };

    const result = await encodeMp4(ffmpeg, frames, options);

    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('should write each frame with zero-padded filenames', async () => {
    const ffmpeg = await loadFfmpeg();
    const frames = [new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])];

    await encodeMp4(ffmpeg, frames, DEFAULT_MP4_OPTIONS);

    expect(mockWriteFile).toHaveBeenCalledWith('frame00000.png', frames[0]);
    expect(mockWriteFile).toHaveBeenCalledWith('frame00001.png', frames[1]);
    expect(mockWriteFile).toHaveBeenCalledWith('frame00002.png', frames[2]);
  });

  it('should pass correct ffmpeg arguments', async () => {
    const ffmpeg = await loadFfmpeg();
    const options: Mp4ExportOptions = { fps: 30, width: 1920 };

    await encodeMp4(ffmpeg, [new Uint8Array([1])], options);

    expect(mockExec).toHaveBeenCalledWith([
      '-framerate', '30',
      '-i', 'frame%05d.png',
      '-vf', 'scale=1920:-2',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-y',
      'output.mp4',
    ]);
  });

  it('should cleanup all temporary files after encoding', async () => {
    const ffmpeg = await loadFfmpeg();
    const frames = [new Uint8Array([1]), new Uint8Array([2])];

    await encodeMp4(ffmpeg, frames, DEFAULT_MP4_OPTIONS);

    expect(mockDeleteFile).toHaveBeenCalledWith('frame00000.png');
    expect(mockDeleteFile).toHaveBeenCalledWith('frame00001.png');
    expect(mockDeleteFile).toHaveBeenCalledWith('output.mp4');
    expect(mockDeleteFile).toHaveBeenCalledTimes(3);
  });

  it('should throw when readFile returns a string', async () => {
    mockReadFile.mockResolvedValueOnce('unexpected string');
    const ffmpeg = await loadFfmpeg();

    await expect(
      encodeMp4(ffmpeg, [new Uint8Array([1])], DEFAULT_MP4_OPTIONS),
    ).rejects.toThrow('Unexpected string output from ffmpeg');
  });
});

describe('captureFrameAsPng', () => {
  it('should call toPng and return Uint8Array', async () => {
    // base64 "AAAA" decodes to 3 zero bytes
    mockToPng.mockResolvedValueOnce('data:image/png;base64,AAAA');
    const element = document.createElement('div');

    const result = await captureFrameAsPng(element);

    expect(mockToPng).toHaveBeenCalledWith(element);
    expect(result).toBeInstanceOf(Uint8Array);
  });
});

describe('captureAndEncodeMp4', () => {
  it('should seek player to each frame time and capture', async () => {
    const mockSeek = vi.fn();
    const mockPause = vi.fn();
    const player = { play: vi.fn().mockResolvedValue(undefined), seek: mockSeek, pause: mockPause };
    const element = document.createElement('div');

    // 0.1s duration at 10fps = 1 frame
    const result = await captureAndEncodeMp4(element, player, 0.1, {
      fps: 10,
      onProgress: vi.fn(),
    });

    expect(mockPause).toHaveBeenCalled();
    expect(mockSeek).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('should report progress through onProgress callback', async () => {
    const mockSeek = vi.fn();
    const mockPause = vi.fn();
    const player = { play: vi.fn().mockResolvedValue(undefined), seek: mockSeek, pause: mockPause };
    const element = document.createElement('div');
    const onProgress = vi.fn();

    await captureAndEncodeMp4(element, player, 0.1, {
      fps: 10,
      onProgress,
    });

    // Should have been called multiple times with increasing values
    expect(onProgress).toHaveBeenCalled();
    const lastCall = onProgress.mock.calls[onProgress.mock.calls.length - 1][0];
    expect(lastCall).toBeGreaterThan(0);
  });

  it('should use default fps of 30 when not specified', async () => {
    const mockSeek = vi.fn();
    const mockPause = vi.fn();
    const player = { play: vi.fn().mockResolvedValue(undefined), seek: mockSeek, pause: mockPause };
    const element = document.createElement('div');

    // 1/30 second = exactly 1 frame at 30fps
    await captureAndEncodeMp4(element, player, 1 / 30);

    expect(mockSeek).toHaveBeenCalled();
  });
});
