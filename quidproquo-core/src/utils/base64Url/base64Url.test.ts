import { describe, expect, it } from 'vitest';

import { base64UrlDecodeUtf8, base64UrlEncodeUtf8, isBase64Url } from './base64Url';

describe('base64Url', () => {
  it('encodes unpadded base64url and round-trips utf8', () => {
    // {"alg":"RS256","typ":"JWT"} is the canonical JWT header encoding
    expect(base64UrlEncodeUtf8('{"alg":"RS256","typ":"JWT"}')).toBe('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9');
    expect(base64UrlDecodeUtf8('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9')).toBe('{"alg":"RS256","typ":"JWT"}');

    const text = 'héllo wörld ✓ >>??';
    const encoded = base64UrlEncodeUtf8(text);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(base64UrlDecodeUtf8(encoded)).toBe(text);
  });

  it('returns null for input that is not base64url', () => {
    expect(base64UrlDecodeUtf8('abc+def')).toBeNull();
    expect(base64UrlDecodeUtf8('abc=')).toBeNull();
    expect(base64UrlDecodeUtf8('')).toBeNull();
    expect(isBase64Url('abc-_9')).toBe(true);
    expect(isBase64Url('abc.def')).toBe(false);
  });
});
