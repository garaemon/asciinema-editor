import type { Anchor, CellAnchor, CellRegion } from '../types/annotation';

// A rectangle expressed as percentages of the overlay container
export interface RectPercent {
  left: number;
  top: number;
  width: number;
  height: number;
}

// The whole container; used until the real terminal area has been measured
export const FULL_RECT: RectPercent = { left: 0, top: 0, width: 100, height: 100 };

function safeRatio(value: number, total: number): number {
  return total > 0 ? value / total : 0;
}

/** Top-left corner of a terminal cell as percentages of the container. */
export function cellToPercent(
  cell: CellAnchor,
  cols: number,
  rows: number,
  rect: RectPercent = FULL_RECT,
): { left: number; top: number } {
  return {
    left: rect.left + safeRatio(cell.col, cols) * rect.width,
    top: rect.top + safeRatio(cell.row, rows) * rect.height,
  };
}

/** A cell region as a percent rect of the container. */
export function regionToPercent(
  region: CellRegion,
  cols: number,
  rows: number,
  rect: RectPercent = FULL_RECT,
): RectPercent {
  return {
    ...cellToPercent(region, cols, rows, rect),
    width: safeRatio(region.colCount, cols) * rect.width,
    height: safeRatio(region.rowCount, rows) * rect.height,
  };
}

/** Position of a callout anchor (cell or free fraction) as percentages of the container. */
export function anchorToPercent(
  anchor: Anchor,
  cols: number,
  rows: number,
  rect: RectPercent = FULL_RECT,
): { left: number; top: number } {
  if (anchor.type === 'cell') {
    return cellToPercent(anchor, cols, rows, rect);
  }
  return {
    left: rect.left + anchor.x * rect.width,
    top: rect.top + anchor.y * rect.height,
  };
}
