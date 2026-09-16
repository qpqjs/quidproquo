import { describe, expect, it } from 'vitest';

import { jsonStringCodec } from './jsonStringCodec';

describe('jsonStringCodec', () => {
  it('decodes json objects and arrays only', () => {
    expect(jsonStringCodec.decode('{"a":1}')).toEqual({ a: 1 });
    expect(jsonStringCodec.decode(' [1,2] ')).toEqual([1, 2]);
    expect(jsonStringCodec.decode('"str"')).toBeNull();
    expect(jsonStringCodec.decode('123')).toBeNull();
    expect(jsonStringCodec.decode('{broken')).toBeNull();
  });

  it('encodes back to a json string', () => {
    expect(jsonStringCodec.encode({ a: 1 })).toBe('{"a":1}');
  });
});
