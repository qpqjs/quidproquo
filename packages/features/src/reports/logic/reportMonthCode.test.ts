import { describe, expect, it } from 'vitest';

import { reportBucketKeys } from './reportBucketKeys';
import { reportMonthCode } from './reportMonthCode';

describe('reportMonthCode', () => {
  it('names the month document by event type and local month', () => {
    expect(reportMonthCode('documentRendered', reportBucketKeys('2026-10-31T13:30:00.000Z', 600))).toBe('documentRendered/2026-10');
    expect(reportMonthCode('documentRendered', reportBucketKeys('2026-10-31T14:30:00.000Z', 600))).toBe('documentRendered/2026-11');
  });
});
