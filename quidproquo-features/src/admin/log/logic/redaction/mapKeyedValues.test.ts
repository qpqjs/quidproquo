import { describe, expect, it } from 'vitest';

import { mapKeyedValues } from './mapKeyedValues';

describe('mapKeyedValues', () => {
  it('replaces matching keys at any depth, case-insensitively, without descending into them', () => {
    const input = { Token: { inner: 'a' }, list: [{ token: 'b' }], other: { deep: { TOKEN: 'c' } }, keep: 'd' };

    const result = mapKeyedValues(input, ['token'], [], () => 'X');

    expect(result).toEqual({ Token: 'X', list: [{ token: 'X' }], other: { deep: { TOKEN: 'X' } }, keep: 'd' });
  });

  it('skips ignored keys but still descends into them', () => {
    const input = { id: { token: 'a' }, token: 'b' };

    const result = mapKeyedValues(input, ['token', 'id'], ['id'], () => 'X');

    expect(result).toEqual({ id: { token: 'X' }, token: 'X' });
  });

  it('does not mutate the input', () => {
    const input = { token: 'a', nested: { token: 'b' } };
    const before = JSON.stringify(input);

    mapKeyedValues(input, ['token'], [], () => 'X');

    expect(JSON.stringify(input)).toBe(before);
  });
});
