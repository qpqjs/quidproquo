import { DayOfWeek, resolveScheduleFields, ScheduleRecurrence } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { scheduleMatchesUtcMinute } from './scheduleMatchesUtcMinute';

const firesAt = (recurrence: ScheduleRecurrence, isoUtc: string): boolean =>
  scheduleMatchesUtcMinute(resolveScheduleFields(recurrence), new Date(isoUtc));

describe('scheduleMatchesUtcMinute', () => {
  it('fires on each step of an interval and not between them', () => {
    expect(firesAt({ everyMinutes: 10 }, '2026-09-01T12:20:00Z')).toBe(true);
    expect(firesAt({ everyMinutes: 10 }, '2026-09-01T12:21:00Z')).toBe(false);
  });

  it('fires every minute for everyMinutes 1', () => {
    expect(firesAt({ everyMinutes: 1 }, '2026-09-01T12:37:00Z')).toBe(true);
  });

  it('ignores seconds within the minute', () => {
    // The ticker asks once a minute and may be a little late; a schedule fires
    // on a minute, not on an instant.
    expect(firesAt({ everyMinutes: 10 }, '2026-09-01T12:20:59.999Z')).toBe(true);
  });

  it('honours the hour for a daily schedule', () => {
    expect(firesAt({ dailyAtUtc: { hour: 17, minute: 5 } }, '2026-09-01T17:05:00Z')).toBe(true);
    expect(firesAt({ dailyAtUtc: { hour: 17, minute: 5 } }, '2026-09-01T16:05:00Z')).toBe(false);
    expect(firesAt({ dailyAtUtc: { hour: 17, minute: 5 } }, '2026-09-01T17:06:00Z')).toBe(false);
  });

  it('fires a weekly schedule only on its day', () => {
    // 2026-09-07 is a Monday, 2026-09-08 a Tuesday.
    const weekly: ScheduleRecurrence = { weeklyAtUtc: { day: DayOfWeek.Monday, hour: 2, minute: 0 } };

    expect(firesAt(weekly, '2026-09-07T02:00:00Z')).toBe(true);
    expect(firesAt(weekly, '2026-09-08T02:00:00Z')).toBe(false);
  });

  it('fires a monthly schedule only on its date', () => {
    const monthly: ScheduleRecurrence = { monthlyAtUtc: { dayOfMonth: 15, hour: 9, minute: 30 } };

    expect(firesAt(monthly, '2026-09-15T09:30:00Z')).toBe(true);
    expect(firesAt(monthly, '2026-09-16T09:30:00Z')).toBe(false);
  });

  it('is evaluated in UTC, not the machine timezone', () => {
    // Same instant, expressed with an offset. A local-time implementation
    // would disagree with the deployed scheduler on any machine east or west
    // of UTC, which is every machine we develop on.
    expect(firesAt({ dailyAtUtc: { hour: 0, minute: 0 } }, '2026-09-01T10:00:00+10:00')).toBe(true);
  });

  it('skips a month that has no such date', () => {
    // Matches AWS: the 31st simply does not occur in September.
    const monthly: ScheduleRecurrence = { monthlyAtUtc: { dayOfMonth: 31, hour: 0, minute: 0 } };

    expect(firesAt(monthly, '2026-08-31T00:00:00Z')).toBe(true);
    expect(firesAt(monthly, '2026-09-30T00:00:00Z')).toBe(false);
  });
});
