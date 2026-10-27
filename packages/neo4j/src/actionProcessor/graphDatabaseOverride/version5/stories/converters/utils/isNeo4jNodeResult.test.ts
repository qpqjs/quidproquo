import { describe, expect, it } from 'vitest';

import { isNeo4jNodeResult } from './isNeo4jNodeResult';

describe('isNeo4jNodeResult', () => {
  it('returns true for a node object', () => {
    expect(isNeo4jNodeResult({ elementId: '1', labels: ['Person'], properties: { name: 'Alice' } })).toBe(true);
  });

  it('returns false for a relationship object', () => {
    expect(isNeo4jNodeResult({ elementId: '1', startNodeElementId: '2', endNodeElementId: '3', type: 'KNOWS', properties: {} })).toBe(false);
  });

  it.each([
    ['a number', 42],
    ['a string', 'hello'],
    ['a boolean', true],
    ['null', null],
  ])('returns false for %s', (_label: string, value: any) => {
    expect(isNeo4jNodeResult(value)).toBe(false);
  });
});
