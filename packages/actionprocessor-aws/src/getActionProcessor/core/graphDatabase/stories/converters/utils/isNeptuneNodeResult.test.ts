import { describe, expect, it } from 'vitest';

import { isNeptuneNodeResult } from './isNeptuneNodeResult';

describe('isNeptuneNodeResult', () => {
  it('accepts an object with a node entity type', () => {
    expect(isNeptuneNodeResult({ '~entityType': 'node' } as never)).toBe(true);
  });

  it.each([
    ['a relationship', { '~entityType': 'relationship' }],
    ['a scalar', 42],
    ['null', null],
  ])('rejects %s', (_label: string, value: unknown) => {
    expect(isNeptuneNodeResult(value as never)).toBe(false);
  });
});
