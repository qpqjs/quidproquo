import { describe, expect, it } from 'vitest';

import { pageKeyToPaginationToken } from './pageKeyToPaginationToken';
import { paginationTokenToPageKey } from './paginationTokenToPageKey';

describe('paginationTokenToPageKey', () => {
  it('base64-encodes the pagination token into a page key', () => {
    expect(paginationTokenToPageKey('token-123')).toBe(Buffer.from('token-123').toString('base64'));
  });

  it('returns undefined when the token is missing', () => {
    expect(paginationTokenToPageKey()).toBeUndefined();
    expect(paginationTokenToPageKey('')).toBeUndefined();
  });

  it('round-trips with pageKeyToPaginationToken', () => {
    expect(pageKeyToPaginationToken(paginationTokenToPageKey('round-trip'))).toBe('round-trip');
  });
});
