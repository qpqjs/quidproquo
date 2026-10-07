import { describe, expect, it } from 'vitest';

import { omitKey } from './omitKey';

describe('omitKey', () => {
  it('returns a copy without the key and leaves the input alone', () => {
    const input = { a: 1, b: 2 };

    const result = omitKey(input, 'a');

    expect(result).toEqual({ b: 2 });
    expect(input).toEqual({ a: 1, b: 2 });
    expect(result).not.toBe(input);
  });

  it('drops the key from the result type', () => {
    const result = omitKey({ a: 1, b: 'two' }, 'a');

    // @ts-expect-error the omitted key is no longer on the type
    expect(result.a).toBeUndefined();
    expect(result.b).toBe('two');
  });

  it('returns an equal copy when a record does not hold the key', () => {
    const record: Record<string, number> = { a: 1 };

    expect(omitKey(record, 'missing')).toEqual({ a: 1 });
  });
});
