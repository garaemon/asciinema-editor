import { describe, it, expect } from 'vitest';
import {
  cellToPercent,
  regionToPercent,
  anchorToPercent,
} from '../overlay-geometry';
import type { RectPercent } from '../overlay-geometry';

const COLS = 80;
const ROWS = 24;
const OFFSET_RECT: RectPercent = { left: 10, top: 5, width: 80, height: 90 };

describe('cellToPercent', () => {
  it('should map a cell to percentages of the full container by default', () => {
    expect(cellToPercent({ row: 6, col: 40 }, COLS, ROWS)).toEqual({ left: 50, top: 25 });
  });

  it('should map the origin cell to the top-left of the terminal rect', () => {
    expect(cellToPercent({ row: 0, col: 0 }, COLS, ROWS, OFFSET_RECT)).toEqual({ left: 10, top: 5 });
  });

  it('should scale into an offset terminal rect', () => {
    // col 40/80 = 0.5 * 80 + 10 = 50; row 12/24 = 0.5 * 90 + 5 = 50
    expect(cellToPercent({ row: 12, col: 40 }, COLS, ROWS, OFFSET_RECT)).toEqual({ left: 50, top: 50 });
  });

  it('should return the rect origin when cols or rows is zero', () => {
    expect(cellToPercent({ row: 3, col: 3 }, 0, 0)).toEqual({ left: 0, top: 0 });
  });
});

describe('regionToPercent', () => {
  it('should map a cell region to a percent rect', () => {
    const region = { row: 6, col: 40, rowCount: 6, colCount: 10 };
    expect(regionToPercent(region, COLS, ROWS)).toEqual({ left: 50, top: 25, width: 12.5, height: 25 });
  });

  it('should scale width and height into an offset terminal rect', () => {
    const region = { row: 0, col: 0, rowCount: 24, colCount: 80 };
    expect(regionToPercent(region, COLS, ROWS, OFFSET_RECT)).toEqual(OFFSET_RECT);
  });

  it('should return a zero-size rect when cols or rows is zero', () => {
    const region = { row: 1, col: 1, rowCount: 2, colCount: 2 };
    expect(regionToPercent(region, 0, 0)).toEqual({ left: 0, top: 0, width: 0, height: 0 });
  });
});

describe('anchorToPercent', () => {
  it('should delegate cell anchors to cellToPercent', () => {
    expect(anchorToPercent({ type: 'cell', row: 6, col: 40 }, COLS, ROWS)).toEqual({ left: 50, top: 25 });
  });

  it('should map free anchors as fractions of the terminal rect', () => {
    expect(anchorToPercent({ type: 'free', x: 0.5, y: 0.5 }, COLS, ROWS)).toEqual({ left: 50, top: 50 });
    expect(anchorToPercent({ type: 'free', x: 1, y: 0 }, COLS, ROWS, OFFSET_RECT)).toEqual({ left: 90, top: 5 });
  });
});
