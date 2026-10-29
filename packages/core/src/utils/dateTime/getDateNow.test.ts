import { describe, expect, it } from 'vitest';

import { getDateNow } from './getDateNow';

describe('getDateNow', () => {
  it('returns the current time as an ISO string that round-trips', () => {
    const now = getDateNow();

    expect(now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(new Date(now).toISOString()).toBe(now);
  });
});
