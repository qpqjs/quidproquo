import { GraphEntityType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askConvertNeptuneRelationshipResultToGraphRelationshipResult } from './askConvertNeptuneRelationshipResultToGraphRelationshipResult';

describe('askConvertNeptuneRelationshipResultToGraphRelationshipResult', () => {
  it('maps a neptune relationship into a graph relationship result', () => {
    const result = runStory(
      askConvertNeptuneRelationshipResultToGraphRelationshipResult({
        '~entityType': 'relationship',
        '~id': 'r1',
        '~start': 'n1',
        '~end': 'n2',
        '~type': 'KNOWS',
        '~properties': { since: 2020 },
      }),
    );

    expect(result).toEqual({
      $entityType: GraphEntityType.Relationship,
      $id: 'r1',
      $start: 'n1',
      $end: 'n2',
      $type: 'KNOWS',
      $properties: { since: 2020 },
    });
  });
});
