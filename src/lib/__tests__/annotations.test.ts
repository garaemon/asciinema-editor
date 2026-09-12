import { describe, it, expect } from 'vitest';
import type { Annotation, CaptionAnnotation } from '../../types/annotation';
import {
  addAnnotation,
  updateAnnotation,
  removeAnnotation,
  visibleAnnotations,
  sortByStart,
  stepIndex,
} from '../annotations';

function caption(id: string, start: number, end: number, text = id): CaptionAnnotation {
  return { id, kind: 'caption', start, end, text };
}

describe('addAnnotation', () => {
  it('should append a new annotation with the generated id', () => {
    const list: Annotation[] = [caption('a', 0, 1)];
    const result = addAnnotation(list, { kind: 'caption', start: 2, end: 3, text: 'hi' }, () => 'b');
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ id: 'b', kind: 'caption', start: 2, end: 3, text: 'hi' });
  });

  it('should not mutate the input list', () => {
    const list: Annotation[] = [];
    addAnnotation(list, { kind: 'caption', start: 0, end: 1, text: 'x' }, () => 'a');
    expect(list).toHaveLength(0);
  });

  it('should generate a non-empty unique id by default', () => {
    const first = addAnnotation([], { kind: 'caption', start: 0, end: 1, text: 'x' });
    const second = addAnnotation(first, { kind: 'caption', start: 0, end: 1, text: 'y' });
    expect(second[0].id).not.toBe('');
    expect(second[0].id).not.toBe(second[1].id);
  });
});

describe('updateAnnotation', () => {
  it('should replace the annotation with the same id', () => {
    const list: Annotation[] = [caption('a', 0, 1), caption('b', 1, 2)];
    const result = updateAnnotation(list, caption('b', 5, 6, 'changed'));
    expect(result[1]).toEqual(caption('b', 5, 6, 'changed'));
    expect(result[0]).toBe(list[0]);
  });

  it('should return an equal list when the id is not found', () => {
    const list: Annotation[] = [caption('a', 0, 1)];
    expect(updateAnnotation(list, caption('zzz', 0, 1))).toEqual(list);
  });
});

describe('removeAnnotation', () => {
  it('should remove the annotation with the given id', () => {
    const list: Annotation[] = [caption('a', 0, 1), caption('b', 1, 2)];
    expect(removeAnnotation(list, 'a')).toEqual([caption('b', 1, 2)]);
  });

  it('should return an equal list when the id is not found', () => {
    const list: Annotation[] = [caption('a', 0, 1)];
    expect(removeAnnotation(list, 'zzz')).toEqual(list);
  });
});

describe('visibleAnnotations', () => {
  const list: Annotation[] = [caption('a', 0, 2), caption('b', 1, 3), caption('c', 5, 6)];

  it('should return annotations whose range contains the time', () => {
    expect(visibleAnnotations(list, 1.5).map((a) => a.id)).toEqual(['a', 'b']);
  });

  it('should include an annotation at its exact start time', () => {
    expect(visibleAnnotations(list, 5).map((a) => a.id)).toEqual(['c']);
  });

  it('should exclude an annotation at its exact end time', () => {
    expect(visibleAnnotations(list, 2).map((a) => a.id)).toEqual(['b']);
  });

  it('should return an empty list when nothing is visible', () => {
    expect(visibleAnnotations(list, 4)).toEqual([]);
  });
});

describe('sortByStart', () => {
  it('should sort by start time without mutating the input', () => {
    const list: Annotation[] = [caption('b', 3, 4), caption('a', 1, 2)];
    expect(sortByStart(list).map((a) => a.id)).toEqual(['a', 'b']);
    expect(list.map((a) => a.id)).toEqual(['b', 'a']);
  });
});

describe('stepIndex', () => {
  const list: Annotation[] = [
    { id: 's2', kind: 'step', start: 5, end: 6, corner: 'top-left' },
    caption('cap', 0, 9),
    { id: 's1', kind: 'step', start: 1, end: 2, corner: 'top-left' },
  ];

  it('should number step annotations by start time, ignoring other kinds', () => {
    expect(stepIndex(list, 's1')).toEqual({ index: 1, total: 2 });
    expect(stepIndex(list, 's2')).toEqual({ index: 2, total: 2 });
  });

  it('should return null for a non-step or unknown id', () => {
    expect(stepIndex(list, 'cap')).toBeNull();
    expect(stepIndex(list, 'nope')).toBeNull();
  });
});
