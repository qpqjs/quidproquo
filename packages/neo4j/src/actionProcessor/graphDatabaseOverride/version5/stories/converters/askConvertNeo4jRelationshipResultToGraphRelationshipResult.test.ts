import { GraphEntityType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askConvertNeo4jRelationshipResultToGraphRelationshipResult } from './askConvertNeo4jRelationshipResultToGraphRelationshipResult';

describe('askConvertNeo4jRelationshipResultToGraphRelationshipResult', () => {
  it('maps a neo4j relationship onto a graph relationship result', () => {
    const result = runStory(
      askConvertNeo4jRelationshipResultToGraphRelationshipResult({
        elementId: 'rel-1',
        startNodeElementId: 'node-1',
        endNodeElementId: 'node-2',
        type: 'KNOWS',
        properties: { since: 2020 },
      }),
    );

    expect(result).toEqual({
      $entityType: GraphEntityType.Relationship,
      $id: 'rel-1',
      $start: 'node-1',
      $end: 'node-2',
      $type: 'KNOWS',
      $properties: { since: 2020 },
    });
  });
});
