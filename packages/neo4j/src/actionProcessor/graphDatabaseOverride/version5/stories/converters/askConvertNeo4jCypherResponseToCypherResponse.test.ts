import { GraphEntityType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askConvertNeo4jCypherResponseToCypherResponse } from './askConvertNeo4jCypherResponseToCypherResponse';

describe('askConvertNeo4jCypherResponseToCypherResponse', () => {
  it('keys each row value by its field name, converting nodes and scalars', () => {
    const result = runStory(
      askConvertNeo4jCypherResponseToCypherResponse({
        data: {
          fields: ['person', 'count'],
          values: [[{ elementId: 'node-1', labels: ['Person'], properties: { name: 'Alice' } }, 1]],
        },
      }),
    );

    expect(result).toEqual({
      results: [
        {
          person: {
            $entityType: GraphEntityType.Node,
            $id: 'node-1',
            $labels: ['Person'],
            $properties: { name: 'Alice' },
          },
          count: 1,
        },
      ],
    });
  });

  it('returns an empty results list when there are no rows', () => {
    const result = runStory(
      askConvertNeo4jCypherResponseToCypherResponse({
        data: { fields: [], values: [] },
      }),
    );

    expect(result).toEqual({ results: [] });
  });
});
