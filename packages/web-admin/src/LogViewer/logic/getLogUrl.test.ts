import { describe, expect, it } from 'vitest';

import { getLogUrl } from './getLogUrl';

describe('getLogUrl', () => {
  it('builds a download url for a correlation', () => {
    expect(getLogUrl('abc-123')).toBe('/log/downloadUrl/abc-123');
  });

  it('returns an empty string when the correlation is empty', () => {
    expect(getLogUrl('')).toBe('');
  });
});
