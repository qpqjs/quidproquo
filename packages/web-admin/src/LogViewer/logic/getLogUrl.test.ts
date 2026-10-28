import { describe, expect, it } from 'vitest';

import { getLogUrl } from './getLogUrl';

const downloadBasePath = '/log/downloadUrl/';

describe('getLogUrl', () => {
  it('builds a download url for a correlation', () => {
    expect(getLogUrl('abc-123')).toBe('/log/downloadUrl/abc-123');
  });

  // The server decodes route params, so the whole id is encoded and the handler still sees `svc::uuid`.
  it('percent-encodes the module::uuid id as one path segment', () => {
    expect(getLogUrl('svc::7f6b0e2a-1c2d-4e3f-8a9b-0c1d2e3f4a5b')).toBe('/log/downloadUrl/svc%3A%3A7f6b0e2a-1c2d-4e3f-8a9b-0c1d2e3f4a5b');
  });

  it('returns an empty string when the correlation is empty', () => {
    expect(getLogUrl('')).toBe('');
  });

  // The correlation is seeded from the admin's ?correlation= url param at boot, so a crafted link controls it.
  // Dot segments and a query cut would otherwise redirect the admin's authenticated request to another route.
  it('keeps a hostile correlation inside the download path as a single segment', () => {
    const url = getLogUrl('../../v1/maintenance?force=true#x');

    expect(url.startsWith(downloadBasePath)).toBe(true);
    expect(url.slice(downloadBasePath.length)).not.toMatch(/[/?#]/);
  });
});
