import { describe, expect, it } from 'vitest';

import { DayOfWeek } from './types/DayOfWeek';
import { InvalidScheduleRecurrenceError, InvalidScheduleRecurrenceErrorCode } from './InvalidScheduleRecurrenceError';
import { resolveScheduleFields } from './resolveScheduleFields';

const EVERY = { hours: null, daysOfMonth: null, months: null, daysOfWeek: null };

describe('resolveScheduleFields', () => {
  it('spreads everyMinutes across the hour', () => {
    expect(resolveScheduleFields({ everyMinutes: 10 })).toEqual({ ...EVERY, minutes: [0, 10, 20, 30, 40, 50] });
  });

  it('treats everyMinutes 1 as every minute of every hour', () => {
    expect(resolveScheduleFields({ everyMinutes: 1 }).minutes).toHaveLength(60);
  });

  it('spreads everyHours across the day, at minute 0 by default', () => {
    expect(resolveScheduleFields({ everyHours: 6 })).toEqual({ ...EVERY, minutes: [0], hours: [0, 6, 12, 18] });
  });

  it('honours atMinute on everyHours', () => {
    expect(resolveScheduleFields({ everyHours: 12, atMinute: 30 })).toEqual({ ...EVERY, minutes: [30], hours: [0, 12] });
  });

  it('pins dailyAtUtc to one hour and minute', () => {
    expect(resolveScheduleFields({ dailyAtUtc: { hour: 17, minute: 5 } })).toEqual({ ...EVERY, minutes: [5], hours: [17] });
  });

  it('pins weeklyAtUtc to a day of week and leaves day of month every', () => {
    expect(resolveScheduleFields({ weeklyAtUtc: { day: DayOfWeek.Monday, hour: 2, minute: 0 } })).toEqual({
      ...EVERY,
      minutes: [0],
      hours: [2],
      daysOfWeek: [DayOfWeek.Monday],
    });
  });

  it('pins monthlyAtUtc to a day of month and leaves day of week every', () => {
    expect(resolveScheduleFields({ monthlyAtUtc: { dayOfMonth: 15, hour: 9, minute: 30 } })).toEqual({
      ...EVERY,
      minutes: [30],
      hours: [9],
      daysOfMonth: [15],
    });
  });

  it('accepts the boundary values', () => {
    expect(resolveScheduleFields({ dailyAtUtc: { hour: 0, minute: 0 } })).toEqual({ ...EVERY, minutes: [0], hours: [0] });
    expect(resolveScheduleFields({ dailyAtUtc: { hour: 23, minute: 59 } })).toEqual({ ...EVERY, minutes: [59], hours: [23] });
  });

  describe('rejections', () => {
    // An interval that does not divide its unit would restart mid-cycle and
    // leave an uneven gap, identically on AWS and locally. Both wrong in the
    // same way is not parity worth having.
    it('rejects an everyMinutes that does not divide 60', () => {
      expect(() => resolveScheduleFields({ everyMinutes: 7 })).toThrow(InvalidScheduleRecurrenceError);
    });

    it('rejects an everyHours that does not divide 24', () => {
      expect(() => resolveScheduleFields({ everyHours: 5 })).toThrow(InvalidScheduleRecurrenceError);
    });

    it('names the valid intervals in the message', () => {
      expect(() => resolveScheduleFields({ everyMinutes: 7 })).toThrow(/1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60/);
    });

    it('codes an out-of-range value distinctly from a bad interval', () => {
      expect(() => resolveScheduleFields({ dailyAtUtc: { hour: 24, minute: 0 } })).toThrow(
        expect.objectContaining({ code: InvalidScheduleRecurrenceErrorCode.ValueOutOfRange }),
      );
      expect(() => resolveScheduleFields({ everyMinutes: 7 })).toThrow(
        expect.objectContaining({ code: InvalidScheduleRecurrenceErrorCode.IntervalDoesNotDivideEvenly }),
      );
    });

    it('rejects a non-integer', () => {
      expect(() => resolveScheduleFields({ dailyAtUtc: { hour: 1.5, minute: 0 } })).toThrow(InvalidScheduleRecurrenceError);
    });

    it('rejects a shape it does not recognise', () => {
      expect(() => resolveScheduleFields({ someDayMaybe: true } as never)).toThrow(
        expect.objectContaining({ code: InvalidScheduleRecurrenceErrorCode.UnknownRecurrence }),
      );
    });
  });
});
