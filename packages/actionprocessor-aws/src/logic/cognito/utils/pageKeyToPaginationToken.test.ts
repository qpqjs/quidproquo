import { describe, expect, it } from 'vitest';

import { pageKeyToPaginationToken } from './pageKeyToPaginationToken';

describe('pageKeyToPaginationToken', () => {
  it('base64-decodes the page key into a pagination token', () => {
    expect(pageKeyToPaginationToken(Buffer.from('token-123').toString('base64'))).toBe('token-123');
  });

  it('returns undefined when the page key is missing', () => {
    expect(pageKeyToPaginationToken()).toBeUndefined();
    expect(pageKeyToPaginationToken('')).toBeUndefined();
  });
});
