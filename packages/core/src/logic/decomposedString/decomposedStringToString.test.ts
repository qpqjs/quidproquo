import { describe, expect, it } from 'vitest';

import { DecomposedString } from '../../types';
import { decomposedStringToString } from './decomposedStringToString';

describe('decomposedStringToString', () => {
  it('interleaves literal segments with stringified values', () => {
    const decomposed: DecomposedString = [
      ['Hello ', ', you are ', '!'],
      ['Alice', 42],
    ];

    expect(decomposedStringToString(decomposed)).toBe('Hello Alice, you are 42!');
  });

  it('returns the single literal when there are no values', () => {
    expect(decomposedStringToString([['just text'], []])).toBe('just text');
  });

  it('applies a custom value resolver', () => {
    const decomposed: DecomposedString = [['<', '>'], ['x']];

    expect(decomposedStringToString(decomposed, (v) => `[${String(v)}]`)).toBe('<[x]>');
  });

  it('returns an empty string for a missing decomposed string instead of throwing', () => {
    expect(decomposedStringToString(undefined as any)).toBe('');
  });

  it('does not print undefined fillers when literal segments are missing', () => {
    const malformed = [['only one segment'], ['a', 'b']] as DecomposedString;

    expect(decomposedStringToString(malformed)).toBe('only one segmentab');
  });
});
