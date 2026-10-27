import { describe, expect, it } from 'vitest';

import { qpqApplicationVersionGlobal } from './qpqApplicationVersionGlobal';

// Deployed function globals are looked up by this key at runtime, so a rename
// here would orphan the value written at deploy time.
describe('qpqApplicationVersionGlobal', () => {
  it('locks the global key name', () => {
    expect(qpqApplicationVersionGlobal).toBe('qpq-application-version');
  });
});
