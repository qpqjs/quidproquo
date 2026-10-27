import { describe, expect, it } from 'vitest';

import { lastEvaluatedKeyToString } from './lastEvaluatedKeyToString';

describe('lastEvaluatedKeyToString', () => {
  it('base64-encodes the JSON of the last evaluated key', () => {
    const key = { pk: { S: 'a' }, sk: { N: '1' } };

    expect(lastEvaluatedKeyToString(key)).toBe(Buffer.from(JSON.stringify(key)).toString('base64'));
  });
});
