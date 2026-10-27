import { describe, expect, it } from 'vitest';

import { isNeptuneScalarResult } from './isNeptuneScalarResult';

describe('isNeptuneScalarResult', () => {
  it.each([
    ['a number', 42],
    ['a string', 'hello'],
    ['a boolean', true],
    ['null', null],
  ])('accepts %s', (_label: string, value: unknown) => {
    expect(isNeptuneScalarResult(value as never)).toBe(true);
  });

  it('rejects an object entity', () => {
    expect(isNeptuneScalarResult({ '~entityType': 'node' } as never)).toBe(false);
  });
});
