import { describe, expect, it } from 'vitest';

import { constructUrlWithParams } from './urlUtils';

describe('constructUrlWithParams', () => {
  it('appends the params to the query string', () => {
    expect(constructUrlWithParams('https://example.com/path', { a: '1', b: 'two' })).toBe('https://example.com/path?a=1&b=two');
  });

  it('url-encodes param values', () => {
    expect(constructUrlWithParams('https://example.com', { q: 'a b&c' })).toBe('https://example.com/?q=a+b%26c');
  });

  it('returns the base url unchanged when there are no params', () => {
    expect(constructUrlWithParams('https://example.com/path', {})).toBe('https://example.com/path');
  });
});
