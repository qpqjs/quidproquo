import { describe, expect, it } from 'vitest';

import { convertDynamoMapToObject } from './convertDynamoMapToObject';

describe('convertDynamoMapToObject', () => {
  it('converts scalar attribute values to their js equivalents', () => {
    expect(
      convertDynamoMapToObject({
        name: { S: 'Ada' },
        age: { N: '42' },
        active: { BOOL: true },
        deleted: { NULL: true },
      }),
    ).toEqual({ name: 'Ada', age: 42, active: true, deleted: null });
  });

  it('converts lists and nested maps recursively', () => {
    expect(
      convertDynamoMapToObject({
        tags: { L: [{ S: 'a' }, { N: '1' }] },
        meta: { M: { nested: { S: 'value' } } },
      }),
    ).toEqual({ tags: ['a', 1], meta: { nested: 'value' } });
  });

  it('converts a missing map to an empty object', () => {
    expect(convertDynamoMapToObject(undefined)).toEqual({});
  });

  it('throws on an unsupported attribute type', () => {
    expect(() => convertDynamoMapToObject({ bin: { B: 'x' } as never })).toThrow('Unsupported DynamoDB data type: B');
  });
});
