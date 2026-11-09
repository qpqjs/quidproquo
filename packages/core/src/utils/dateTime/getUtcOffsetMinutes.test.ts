import { describe, expect, it } from 'vitest';

import { UtcOffset } from '../../types/QpqIsoDateTime';
import { getUtcOffsetMinutes } from './getUtcOffsetMinutes';

describe('getUtcOffsetMinutes', () => {
  it('reads whole, half and quarter hour offsets either side of UTC', () => {
    expect(getUtcOffsetMinutes('+10:00')).toBe(600);
    expect(getUtcOffsetMinutes('+09:30')).toBe(570);
    expect(getUtcOffsetMinutes('+05:45')).toBe(345);
    expect(getUtcOffsetMinutes('-03:30')).toBe(-210);
    expect(getUtcOffsetMinutes('+00:00')).toBe(0);
  });

  it('accepts the extremes in use, -12:00 and +14:00', () => {
    expect(getUtcOffsetMinutes('-12:00')).toBe(-720);
    expect(getUtcOffsetMinutes('+14:00')).toBe(840);
  });

  // Cast: these are the values the type cannot rule out, or untrusted text, which the runtime check exists for.
  it('is null for anything that is not a real offset', () => {
    ['10', '+10', '10:00', '+1:00', '+10:00 ', '+15:00', '-12:30', '+10:20', '+10:60', 'Australia/Brisbane', ''].forEach((offset) =>
      expect(getUtcOffsetMinutes(offset as UtcOffset)).toBeNull(),
    );
  });
});
