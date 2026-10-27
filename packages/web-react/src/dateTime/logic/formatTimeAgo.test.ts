import { describe, expect, it } from 'vitest';

import { formatTimeAgo, getTimeAgoUpdateIntervalMs } from './formatTimeAgo';

const now = new Date('2026-06-26T12:00:00.000Z');
const secondsAgo = (seconds: number) => new Date(now.getTime() - seconds * 1000);

describe('formatTimeAgo', () => {
  it.each([
    ['now', 0, 'now'],
    ['seconds in the past', 30, '30 seconds ago'],
    ['one minute in the past', 60, '1 minute ago'],
    ['minutes in the past', 5 * 60, '5 minutes ago'],
    ['one day in the past', 24 * 60 * 60, 'yesterday'],
    ['days in the past', 3 * 24 * 60 * 60, '3 days ago'],
  ])('formats %s', (_label: string, seconds: number, expected: string) => {
    expect(formatTimeAgo(secondsAgo(seconds), now, 'en')).toBe(expected);
  });

  it('formats future dates', () => {
    expect(formatTimeAgo(secondsAgo(-2 * 60 * 60), now, 'en')).toBe('in 2 hours');
  });

  it('defaults now to the current time when omitted', () => {
    expect(formatTimeAgo(new Date(), undefined, 'en')).toBe('now');
  });
});

describe('getTimeAgoUpdateIntervalMs', () => {
  it.each([
    ['seconds for sub-minute ages', 30, 1000],
    ['minutes for sub-hour ages', 30 * 60, 60 * 1000],
    ['hours for sub-day ages', 5 * 60 * 60, 60 * 60 * 1000],
    ['days for older ages', 3 * 24 * 60 * 60, 60 * 60 * 24 * 1000],
  ])('ticks every %s', (_label: string, seconds: number, expected: number) => {
    expect(getTimeAgoUpdateIntervalMs(secondsAgo(seconds), now)).toBe(expected);
  });

  it('is symmetric for future dates', () => {
    expect(getTimeAgoUpdateIntervalMs(secondsAgo(-30), now)).toBe(1000);
  });
});
