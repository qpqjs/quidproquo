import { describe, expect, it } from 'vitest';

import { formUrlEncodedCodec } from './formUrlEncodedCodec';

describe('formUrlEncodedCodec', () => {
  it('decodes form bodies, including percent-encoding, empty values and repeated keys', () => {
    expect(formUrlEncodedCodec.decode('username=joe&password=hun%26ter+2&empty=&tag=a&tag=b')).toEqual({
      username: 'joe',
      password: 'hun&ter 2',
      empty: '',
      tag: ['a', 'b'],
    });
  });

  it('encodes back to a form body', () => {
    expect(formUrlEncodedCodec.encode({ username: 'joe', password: 'hun&ter 2', tag: ['a', 'b'] })).toBe(
      'username=joe&password=hun%26ter+2&tag=a&tag=b',
    );
  });

  it('rejects urls, prose, json and anything with whitespace or path characters', () => {
    expect(formUrlEncodedCodec.decode('https://x.com/?a=b')).toBeNull();
    expect(formUrlEncodedCodec.decode('/path?a=b')).toBeNull();
    expect(formUrlEncodedCodec.decode('a = b')).toBeNull();
    expect(formUrlEncodedCodec.decode('set x=1 then y=2')).toBeNull();
    expect(formUrlEncodedCodec.decode('{"a":"b"}')).toBeNull();
    expect(formUrlEncodedCodec.decode('eyJhIjoiYmMifQ==')).toBeNull();
    expect(formUrlEncodedCodec.decode('plain')).toBeNull();
    expect(formUrlEncodedCodec.decode('')).toBeNull();
  });
});
