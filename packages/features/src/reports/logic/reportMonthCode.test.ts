import { describe, expect, it } from 'vitest';

import { reportBucketKeys } from './reportBucketKeys';
import { reportMonthCode } from './reportMonthCode';
import { reportMonthDocId } from './reportMonthDocId';

describe('reportMonthCode and reportMonthDocId', () => {
  it('names the month document by event type and local month', () => {
    expect(reportMonthCode('documentRendered', reportBucketKeys('2026-10-31T13:30:00.000Z', 600).month)).toBe('documentRendered/2026-10');
    expect(reportMonthCode('documentRendered', reportBucketKeys('2026-10-31T14:30:00.000Z', 600).month)).toBe('documentRendered/2026-11');
  });

  it('gives the document an id with no / or #, which cannot be mistaken for another type and month', () => {
    expect(reportMonthDocId('documentRendered', '2026-11')).toBe('documentRendered~2026-11');
    expect(reportMonthDocId('a.b', '2026-11')).not.toBe(reportMonthDocId('a', 'b.2026-11'));
  });
});
