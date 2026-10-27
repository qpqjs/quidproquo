import { describe, expect, it } from 'vitest';

import { lastEvaluatedKeyToString } from './lastEvaluatedKeyToString';
import { stringToLastEvaluatedKey } from './stringToLastEvaluatedKey';

describe('stringToLastEvaluatedKey', () => {
  it('decodes a base64 JSON string back into the key record', () => {
    const key = { pk: { S: 'a' } };

    expect(stringToLastEvaluatedKey(Buffer.from(JSON.stringify(key)).toString('base64'))).toEqual(key);
  });

  it('round-trips with lastEvaluatedKeyToString', () => {
    const key = { pk: { S: 'a' }, sk: { N: '1' } };

    expect(stringToLastEvaluatedKey(lastEvaluatedKeyToString(key))).toEqual(key);
  });
});
