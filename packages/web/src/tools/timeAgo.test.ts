import { describe, expect, it } from 'vitest';

import { formatTimeAgo, getTimeAgoUpdateIntervalMs } from './timeAgo';

const NOW = new Date('2026-06-26T12:00:00.000Z');
const at = (secondsOffset: number) => new Date(NOW.getTime() + secondsOffset * 1000);

describe('formatTimeAgo', () => {
  it('returns an empty string for an invalid date', () => {
    expect(formatTimeAgo(new Date(''), NOW, 'en')).toBe('');
  });

  it.each([
    ['now', 0, 'now'],
    ['seconds in the past', -30, '30 seconds ago'],
    ['seconds in the future', 30, 'in 30 seconds'],
    ['minutes in the past', -120, '2 minutes ago'],
    ['hours in the past', -2 * 60 * 60, '2 hours ago'],
    ['a day in the past', -24 * 60 * 60, 'yesterday'],
    ['a day in the future', 24 * 60 * 60, 'tomorrow'],
    ['days in the past', -3 * 24 * 60 * 60, '3 days ago'],
  ])('formats %s', (_label: string, secondsOffset: number, expected: string) => {
    expect(formatTimeAgo(at(secondsOffset), NOW, 'en')).toBe(expected);
  });

  it('falls through to years for distant dates', () => {
    expect(formatTimeAgo(at(-1000 * 24 * 60 * 60), NOW, 'en')).toMatch(/years? ago/);
  });
});

describe('getTimeAgoUpdateIntervalMs', () => {
  it.each([
    ['under a minute', 30, 1000],
    ['under an hour', 120, 60 * 1000],
    ['under a day', 2 * 60 * 60, 60 * 60 * 1000],
    ['a day or coarser', 5 * 24 * 60 * 60, 60 * 60 * 24 * 1000],
  ])('ticks every interval for %s', (_label: string, secondsOffset: number, expected: number) => {
    expect(getTimeAgoUpdateIntervalMs(at(-secondsOffset), NOW)).toBe(expected);
  });
});
