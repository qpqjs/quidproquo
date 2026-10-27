import { ErrorTypeEnum, GraphEntityType, runStory, StoryError } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askConvertAnyNeptuneResultToAnyGraphResult } from './askConvertAnyNeptuneResultToAnyGraphResult';

describe('askConvertAnyNeptuneResultToAnyGraphResult', () => {
  it('returns a scalar result unchanged', () => {
    expect(runStory(askConvertAnyNeptuneResultToAnyGraphResult(7))).toBe(7);
  });

  it('converts a node result', () => {
    const result = runStory(askConvertAnyNeptuneResultToAnyGraphResult({ '~entityType': 'node', '~id': 'n1', '~labels': ['L'], '~properties': {} }));

    expect(result).toEqual({ $entityType: GraphEntityType.Node, $id: 'n1', $labels: ['L'], $properties: {} });
  });

  it('converts a relationship result', () => {
    const result = runStory(
      askConvertAnyNeptuneResultToAnyGraphResult({
        '~entityType': 'relationship',
        '~id': 'r1',
        '~start': 'a',
        '~end': 'b',
        '~type': 'T',
        '~properties': {},
      }),
    );

    expect(result).toEqual({ $entityType: GraphEntityType.Relationship, $id: 'r1', $start: 'a', $end: 'b', $type: 'T', $properties: {} });
  });

  it('throws for an unrecognised result shape', () => {
    expect(() => runStory(askConvertAnyNeptuneResultToAnyGraphResult({ '~entityType': 'mystery' } as never))).toThrow(StoryError);

    try {
      runStory(askConvertAnyNeptuneResultToAnyGraphResult({ '~entityType': 'mystery' } as never));
    } catch (error) {
      expect((error as StoryError).errorType).toBe(ErrorTypeEnum.GenericError);
    }
  });
});
