import { describe, expect, it } from 'vitest';

import { parseQueryString } from './queryStringUtils';

describe('parseQueryString', () => {
  it('returns an empty object for an empty query string', () => {
    expect(parseQueryString('')).toEqual({});
  });

  it('parses a single key as a string', () => {
    expect(parseQueryString('a=1')).toEqual({ a: '1' });
  });

  it('parses a repeated key as a string array, in order', () => {
    expect(parseQueryString('a=1&tag=x&tag=y&tag=z')).toEqual({ a: '1', tag: ['x', 'y', 'z'] });
  });

  it('decodes percent-encoded and plus-encoded values and keys', () => {
    expect(parseQueryString('q=a+b%26c&na%20me=v%2Fw')).toEqual({ q: 'a b&c', 'na me': 'v/w' });
  });

  it('gives a key with no value an empty string', () => {
    expect(parseQueryString('flag')).toEqual({ flag: '' });
    expect(parseQueryString('flag=')).toEqual({ flag: '' });
  });

  it('ignores a leading question mark', () => {
    expect(parseQueryString('?a=1&b=2')).toEqual({ a: '1', b: '2' });
  });
});
