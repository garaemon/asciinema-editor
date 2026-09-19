import type { Annotation } from "../types/annotation";
import { visibleAnnotations, stepIndex } from "../lib/annotations";
import { anchorToPercent, regionToPercent, FULL_RECT } from "../lib/overlay-geometry";
import type { RectPercent } from "../lib/overlay-geometry";

interface AnnotationOverlayProps {
  annotations: Annotation[];
  // Output-timeline seconds the overlay should reflect
  outputTime: number;
  cols: number;
  rows: number;
  // Measured terminal area inside the container; defaults to the whole container
  terminalRect?: RectPercent;
}

/**
 * Visual layer rendered over the player. Positioned absolutely inside a
 * `position: relative` container so it is captured together with the
 * terminal by html-to-image during export.
 */
export function AnnotationOverlay({ annotations, outputTime, cols, rows, terminalRect = FULL_RECT }: AnnotationOverlayProps) {
  const visible = visibleAnnotations(annotations, outputTime);

  const renderAnnotation = (annotation: Annotation) => {
    switch (annotation.kind) {
    case "callout": {
      const { left, top } = anchorToPercent(annotation.anchor, cols, rows, terminalRect);
      return (
        <div
          key={annotation.id}
          className="annotation-callout"
          data-pointer={annotation.pointer}
          style={{ left: `${left}%`, top: `${top}%` }}
        >
          {annotation.title && <strong>{annotation.title}</strong>}
          <span>{annotation.body}</span>
        </div>
      );
    }
    case "highlight": {
      const rect = regionToPercent(annotation.region, cols, rows, terminalRect);
      return (
        <div
          key={annotation.id}
          className="annotation-highlight"
          style={{ left: `${rect.left}%`, top: `${rect.top}%`, width: `${rect.width}%`, height: `${rect.height}%` }}
        />
      );
    }
    case "caption":
      return (
        <div key={annotation.id} className="annotation-caption">
          {annotation.text}
        </div>
      );
    case "step": {
      const position = stepIndex(annotations, annotation.id);
      const label = annotation.label ?? (position ? `Step ${position.index}/${position.total}` : "Step");
      return (
        <div key={annotation.id} className="annotation-step" data-corner={annotation.corner}>
          {label}
        </div>
      );
    }
    }
  };

  return (
    <div className="annotation-overlay" data-testid="annotation-overlay">
      {visible.map(renderAnnotation)}
    </div>
  );
}
