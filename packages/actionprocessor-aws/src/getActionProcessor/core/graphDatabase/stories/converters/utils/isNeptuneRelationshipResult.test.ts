import { describe, expect, it } from 'vitest';

import { isNeptuneRelationshipResult } from './isNeptuneRelationshipResult';

describe('isNeptuneRelationshipResult', () => {
  it('accepts a fully formed relationship result', () => {
    expect(isNeptuneRelationshipResult({ '~entityType': 'relationship', '~start': 'a', '~end': 'b', '~type': 'KNOWS' } as never)).toBe(true);
  });

  it.each([
    ['missing ~start', { '~entityType': 'relationship', '~end': 'b', '~type': 'KNOWS' }],
    ['missing ~end', { '~entityType': 'relationship', '~start': 'a', '~type': 'KNOWS' }],
    ['missing ~type', { '~entityType': 'relationship', '~start': 'a', '~end': 'b' }],
    ['a node', { '~entityType': 'node' }],
    ['null', null],
  ])('rejects %s', (_label: string, value: unknown) => {
    expect(isNeptuneRelationshipResult(value as never)).toBe(false);
  });
});
