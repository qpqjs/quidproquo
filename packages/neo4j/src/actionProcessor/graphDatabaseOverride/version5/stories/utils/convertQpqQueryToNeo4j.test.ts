import { describe, expect, it } from 'vitest';

import { convertQpqQueryToNeo4j } from './convertQpqQueryToNeo4j';

describe('convertQpqQueryToNeo4j', () => {
  it.each([
    ['MATCH (n) RETURN qpqElementId(n)', 'MATCH (n) RETURN elementId(n)'],
    ['RETURN qpqElementId(n), qpqElementId(m)', 'RETURN elementId(n), elementId(m)'],
  ])('rewrites qpqElementId to elementId in %s', (input: string, expected: string) => {
    expect(convertQpqQueryToNeo4j(input)).toBe(expected);
  });

  it('leaves queries without qpqElementId unchanged', () => {
    expect(convertQpqQueryToNeo4j('MATCH (n) RETURN n')).toBe('MATCH (n) RETURN n');
  });
});
