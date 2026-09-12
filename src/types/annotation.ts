// Annotation type definitions for video-style overlays.
//
// Annotations are visual elements layered over the terminal (callouts,
// highlights, captions, step badges). Their `start`/`end` are in OUTPUT
// timeline seconds, i.e. after holds have been inserted.
//
// Holds pause the output at a SOURCE timestamp for `duration` seconds and
// therefore define the mapping between source and output time.

export type PointerDirection = 'none' | 'up' | 'down' | 'left' | 'right';
export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// 0-based terminal cell coordinates
export interface CellAnchor {
  row: number;
  col: number;
}

// Rectangular region of terminal cells, 0-based, sizes in cells
export interface CellRegion extends CellAnchor {
  rowCount: number;
  colCount: number;
}

// Where a callout is placed: a terminal cell, or a free position given as a
// fraction (0..1) of the terminal area.
export type Anchor =
  | ({ type: 'cell' } & CellAnchor)
  | { type: 'free'; x: number; y: number };

interface AnnotationBase {
  id: string;
  // Output-timeline seconds, inclusive start / exclusive end
  start: number;
  end: number;
}

export interface CalloutAnnotation extends AnnotationBase {
  kind: 'callout';
  title?: string;
  body: string;
  anchor: Anchor;
  pointer: PointerDirection;
}

export interface HighlightAnnotation extends AnnotationBase {
  kind: 'highlight';
  region: CellRegion;
}

export interface CaptionAnnotation extends AnnotationBase {
  kind: 'caption';
  text: string;
}

export interface StepAnnotation extends AnnotationBase {
  kind: 'step';
  // Overrides the auto-generated "Step N/M" label when set
  label?: string;
  corner: Corner;
}

export type Annotation =
  | CalloutAnnotation
  | HighlightAnnotation
  | CaptionAnnotation
  | StepAnnotation;

export type AnnotationKind = Annotation['kind'];

// Freeze the frame at source `time` for `duration` seconds
export interface Hold {
  id: string;
  time: number;
  duration: number;
}

export interface AnnotationTrack {
  annotations: Annotation[];
  holds: Hold[];
}

export const EMPTY_TRACK: AnnotationTrack = { annotations: [], holds: [] };
