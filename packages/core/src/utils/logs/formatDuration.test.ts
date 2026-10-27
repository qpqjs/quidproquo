import { describe, expect, it } from 'vitest';

import { formatDuration } from './formatDuration';

describe('formatDuration', () => {
  it('formats sub-minute durations as seconds only', () => {
    expect(formatDuration(5000)).toBe('5s');
  });

  it('returns 0s for a zero duration', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('includes a minutes part once past a minute', () => {
    expect(formatDuration(90000)).toBe('1m 30s');
  });

  it('rounds the seconds part', () => {
    expect(formatDuration(1500)).toBe('2s');
  });

  it('carries into minutes instead of showing 60s when rounding up', () => {
    expect(formatDuration(119999)).toBe('2m 0s');
  });

  it('shows 1m 0s at exactly one minute', () => {
    expect(formatDuration(60000)).toBe('1m 0s');
  });

  it('carries 59.9s into the minutes part', () => {
    expect(formatDuration(59999)).toBe('1m 0s');
  });
});
