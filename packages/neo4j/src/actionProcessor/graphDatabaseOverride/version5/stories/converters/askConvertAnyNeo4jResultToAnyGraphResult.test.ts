import { GraphEntityType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askConvertAnyNeo4jResultToAnyGraphResult } from './askConvertAnyNeo4jResultToAnyGraphResult';

describe('askConvertAnyNeo4jResultToAnyGraphResult', () => {
  it.each([
    ['a number', 42],
    ['a string', 'hello'],
    ['a boolean', true],
    ['null', null],
  ])('returns %s scalars unchanged', (_label: string, value: any) => {
    expect(runStory(askConvertAnyNeo4jResultToAnyGraphResult(value))).toBe(value);
  });

  it('converts a node result into a graph node', () => {
    const result = runStory(askConvertAnyNeo4jResultToAnyGraphResult({ elementId: 'node-1', labels: ['Person'], properties: { name: 'Alice' } }));

    expect(result).toEqual({
      $entityType: GraphEntityType.Node,
      $id: 'node-1',
      $labels: ['Person'],
      $properties: { name: 'Alice' },
    });
  });

  it('converts a relationship result into a graph relationship', () => {
    const result = runStory(
      askConvertAnyNeo4jResultToAnyGraphResult({
        elementId: 'rel-1',
        startNodeElementId: 'node-1',
        endNodeElementId: 'node-2',
        type: 'KNOWS',
        properties: {},
      }),
    );

    expect(result).toEqual({
      $entityType: GraphEntityType.Relationship,
      $id: 'rel-1',
      $start: 'node-1',
      $end: 'node-2',
      $type: 'KNOWS',
      $properties: {},
    });
  });
});
