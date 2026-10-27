import { GraphEntityType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askConvertNeo4jNodeResultToGraphNodeResult } from './askConvertNeo4jNodeResultToGraphNodeResult';

describe('askConvertNeo4jNodeResultToGraphNodeResult', () => {
  it('maps a neo4j node onto a graph node result', () => {
    const result = runStory(
      askConvertNeo4jNodeResultToGraphNodeResult({
        elementId: 'node-1',
        labels: ['Person', 'User'],
        properties: { name: 'Alice' },
      }),
    );

    expect(result).toEqual({
      $entityType: GraphEntityType.Node,
      $id: 'node-1',
      $labels: ['Person', 'User'],
      $properties: { name: 'Alice' },
    });
  });
});
