import { GraphEntityType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askConvertNeptuneCypherResponseToCypherResponse } from './askConvertNeptuneCypherResponseToCypherResponse';

describe('askConvertNeptuneCypherResponseToCypherResponse', () => {
  it('converts each query result row in the response', () => {
    const result = runStory(
      askConvertNeptuneCypherResponseToCypherResponse({
        results: [{ count: 1 }, { node: { '~entityType': 'node', '~id': 'n1', '~labels': ['L'], '~properties': {} } }],
      }),
    );

    expect(result).toEqual({
      results: [{ count: 1 }, { node: { $entityType: GraphEntityType.Node, $id: 'n1', $labels: ['L'], $properties: {} } }],
    });
  });
});
