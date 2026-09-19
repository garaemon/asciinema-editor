import type { Annotation } from '../types/annotation';

export type IdGenerator = () => string;

// Default id generator; tests inject a deterministic one instead
export const defaultIdGenerator: IdGenerator = () => crypto.randomUUID();

// Omit that distributes over each member of a union instead of collapsing to common keys
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

// Annotation input without an id; the id is assigned on add
export type AnnotationInput = DistributiveOmit<Annotation, 'id'>;

/** Append a new annotation. Returns a new list; the input is not mutated. */
export function addAnnotation(
  list: Annotation[],
  input: AnnotationInput,
  generateId: IdGenerator = defaultIdGenerator,
): Annotation[] {
  return [...list, { ...input, id: generateId() }];
}

/** Replace the annotation with the same id. No-op if the id is not found. */
export function updateAnnotation(list: Annotation[], updated: Annotation): Annotation[] {
  return list.map((annotation) => (annotation.id === updated.id ? updated : annotation));
}

/** Remove the annotation with the given id. No-op if the id is not found. */
export function removeAnnotation(list: Annotation[], id: string): Annotation[] {
  return list.filter((annotation) => annotation.id !== id);
}

/** Annotations visible at `outputTime` (start inclusive, end exclusive). */
export function visibleAnnotations(list: Annotation[], outputTime: number): Annotation[] {
  return list.filter((annotation) => annotation.start <= outputTime && outputTime < annotation.end);
}

/** Copy of the list ordered by start time. */
export function sortByStart(list: Annotation[]): Annotation[] {
  return [...list].sort((a, b) => a.start - b.start);
}

/**
 * 1-based position of a step annotation among all step annotations ordered by
 * start time, plus the total count. Returns null when `id` is not a step.
 */
export function stepIndex(
  list: Annotation[],
  id: string,
): { index: number; total: number } | null {
  const steps = sortByStart(list.filter((annotation) => annotation.kind === 'step'));
  const position = steps.findIndex((step) => step.id === id);
  if (position === -1) {
    return null;
  }
  return { index: position + 1, total: steps.length };
}
