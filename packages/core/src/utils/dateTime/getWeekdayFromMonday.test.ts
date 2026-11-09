import { describe, expect, it } from 'vitest';

import { getWeekdayFromMonday } from './getWeekdayFromMonday';

describe('getWeekdayFromMonday', () => {
  it('counts Monday as 0 and Sunday as 6', () => {
    expect(getWeekdayFromMonday('2026-11-09')).toBe(0);
    expect(getWeekdayFromMonday('2026-11-11')).toBe(2);
    expect(getWeekdayFromMonday('2026-11-15')).toBe(6);
    expect(getWeekdayFromMonday('2026-11-01')).toBe(6);
  });
});
