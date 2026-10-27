import { KvsAdvancedDataType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { buildAttributeValue } from './buildAttributeValue';

describe('buildAttributeValue', () => {
  it('maps scalars to dynamo attribute values', () => {
    expect(buildAttributeValue('hi')).toEqual({ S: 'hi' });
    expect(buildAttributeValue(30)).toEqual({ N: '30' });
    expect(buildAttributeValue(true)).toEqual({ BOOL: true });
    expect(buildAttributeValue(null as unknown as KvsAdvancedDataType)).toEqual({ NULL: true });
  });

  it('maps arrays to lists and objects to maps, dropping undefined members', () => {
    expect(buildAttributeValue(['a', 1])).toEqual({ L: [{ S: 'a' }, { N: '1' }] });
    expect(buildAttributeValue({ a: 'x', b: undefined } as unknown as KvsAdvancedDataType)).toEqual({ M: { a: { S: 'x' } } });
  });

  it('throws for an unsupported data type', () => {
    expect(() => buildAttributeValue(undefined as unknown as KvsAdvancedDataType)).toThrow('Unsupported data type in kvs expression: undefined');
  });
});
