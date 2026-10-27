import { GraphEntityType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askConvertNeptuneNodeResultToGraphNodeResult } from './askConvertNeptuneNodeResultToGraphNodeResult';

describe('askConvertNeptuneNodeResultToGraphNodeResult', () => {
  it('maps a neptune node into a graph node result', () => {
    const result = runStory(
      askConvertNeptuneNodeResultToGraphNodeResult({
        '~entityType': 'node',
        '~id': 'n1',
        '~labels': ['Person'],
        '~properties': { name: 'Ada' },
      }),
    );

    expect(result).toEqual({
      $entityType: GraphEntityType.Node,
      $id: 'n1',
      $labels: ['Person'],
      $properties: { name: 'Ada' },
    });
  });
});
