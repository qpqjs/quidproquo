import { describe, expect, it } from 'vitest';

import { encodeLogPathSegment } from './encodeLogPathSegment';

describe('encodeLogPathSegment', () => {
  it('leaves a module::uuid correlation untouched', () => {
    expect(encodeLogPathSegment('svc::7f6b0e2a-1c2d-4e3f-8a9b-0c1d2e3f4a5b')).toBe('svc::7f6b0e2a-1c2d-4e3f-8a9b-0c1d2e3f4a5b');
  });

  it('encodes every character that could change the path or query', () => {
    expect(encodeLogPathSegment('../a?b=1#c %d')).toBe('..%2Fa%3Fb%3D1%23c%20%25d');
  });

  it('never yields a segment containing a raw slash, question mark or hash', () => {
    expect(encodeLogPathSegment('../../v1/maintenance?force=true#x')).not.toMatch(/[/?#]/);
  });
});
