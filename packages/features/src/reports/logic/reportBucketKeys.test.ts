import { describe, expect, it } from 'vitest';

import { reportBucketKeys } from './reportBucketKeys';

describe('reportBucketKeys', () => {
  it('keys an instant by its local hour, day and month at the offset, so a late render belongs to that local day', () => {
    // At +10:00, 13:30Z on 31 October is 23:30 that night, and 14:30Z is 00:30 on 1 November.
    expect(reportBucketKeys('2026-10-31T13:30:00.000Z', 600)).toEqual({ hour: '2026-10-31T23:00', day: '2026-10-31', month: '2026-10' });
    expect(reportBucketKeys('2026-10-31T14:30:00.000Z', 600)).toEqual({ hour: '2026-11-01T00:00', day: '2026-11-01', month: '2026-11' });
    expect(reportBucketKeys('2026-10-31T13:30:00.000Z', 0)).toEqual({ hour: '2026-10-31T13:00', day: '2026-10-31', month: '2026-10' });
  });

  it('handles half and quarter hour offsets, and offsets behind UTC', () => {
    // +09:30: 14:29Z is 23:59 on the 8th, 14:30Z is midnight on the 9th.
    expect(reportBucketKeys('2026-11-08T14:29:00.000Z', 570).hour).toBe('2026-11-08T23:00');
    expect(reportBucketKeys('2026-11-08T14:30:00.000Z', 570).hour).toBe('2026-11-09T00:00');
    // +05:45: 18:15Z is midnight on the 10th. -03:30: 02:00Z is 22:30 on the 8th.
    expect(reportBucketKeys('2026-11-09T18:15:00.000Z', 345).hour).toBe('2026-11-10T00:00');
    expect(reportBucketKeys('2026-11-09T02:00:00.000Z', -210).hour).toBe('2026-11-08T22:00');
  });

  it('rolls over a year end', () => {
    expect(reportBucketKeys('2025-12-31T14:00:00.000Z', 600)).toEqual({ hour: '2026-01-01T00:00', day: '2026-01-01', month: '2026-01' });
  });
});
