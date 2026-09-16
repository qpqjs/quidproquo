import { describe, expect, it } from 'vitest';

import { base64Codec } from './base64Codec';

describe('base64Codec', () => {
  it('decodes strict base64 text and round-trips through encode', () => {
    const text = '{"password":"pw"}';
    const encoded = Buffer.from(text).toString('base64');

    expect(base64Codec.decode(encoded)).toBe(text);
    expect(base64Codec.encode(text)).toBe(encoded);
  });

  it('rejects text that is not strict base64 or is not valid utf8 underneath', () => {
    expect(base64Codec.decode('hello world')).toBeNull();
    expect(base64Codec.decode('abc')).toBeNull();
    expect(base64Codec.decode('')).toBeNull();
    expect(base64Codec.decode('////')).toBeNull();
  });
});
