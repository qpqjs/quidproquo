import { GraphEntityType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askConvertNeptuneQueryResultToGraphQueryResult } from './askConvertNeptuneQueryResultToGraphQueryResult';

describe('askConvertNeptuneQueryResultToGraphQueryResult', () => {
  it('converts every keyed result in the row', () => {
    const result = runStory(
      askConvertNeptuneQueryResultToGraphQueryResult({
        count: 3,
        node: { '~entityType': 'node', '~id': 'n1', '~labels': ['L'], '~properties': {} },
      }),
    );

    expect(result).toEqual({
      count: 3,
      node: { $entityType: GraphEntityType.Node, $id: 'n1', $labels: ['L'], $properties: {} },
    });
  });

  it('returns an empty object for an empty row', () => {
    expect(runStory(askConvertNeptuneQueryResultToGraphQueryResult({}))).toEqual({});
  });
});
