import { runStory, StoryError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { GraphEntityType } from '../../config/settings/graphDatabase/types/GraphEntityType';
import { ErrorTypeEnum } from '../../types/ErrorTypeEnum';
import { createAnyGraphResultConverter } from './createAnyGraphResultConverter';

type Cell = number | { kind: 'node'; id: string } | { kind: 'rel'; id: string } | { kind: 'other' };

const askConvertAny = createAnyGraphResultConverter<Cell, Extract<Cell, { kind: 'node' }>, Extract<Cell, { kind: 'rel' }>>({
  vendor: 'test',
  isNode: (cell): cell is Extract<Cell, { kind: 'node' }> => typeof cell === 'object' && cell.kind === 'node',
  isRelationship: (cell): cell is Extract<Cell, { kind: 'rel' }> => typeof cell === 'object' && cell.kind === 'rel',
  *askConvertNode(node) {
    return { $entityType: GraphEntityType.Node, $id: node.id, $labels: [], $properties: {} };
  },
  *askConvertRelationship(relationship) {
    return { $entityType: GraphEntityType.Relationship, $id: relationship.id, $type: 'r', $start: 'a', $end: 'b', $properties: {} };
  },
});

describe('createAnyGraphResultConverter', () => {
  it('passes scalars through and routes entities to the vendor converters', () => {
    expect(runStory(askConvertAny(7))).toBe(7);
    expect(runStory(askConvertAny({ kind: 'node', id: 'n1' }))).toMatchObject({ $entityType: GraphEntityType.Node, $id: 'n1' });
    expect(runStory(askConvertAny({ kind: 'rel', id: 'r1' }))).toMatchObject({ $entityType: GraphEntityType.Relationship, $id: 'r1' });
  });

  it('throws GenericError naming the vendor for a cell it cannot place', () => {
    let thrown: unknown;
    try {
      runStory(askConvertAny({ kind: 'other' }));
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(StoryError);
    expect((thrown as StoryError).errorType).toBe(ErrorTypeEnum.GenericError);
    expect((thrown as StoryError).errorText).toContain('test');
  });
});
