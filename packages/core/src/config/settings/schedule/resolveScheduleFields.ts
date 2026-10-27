import { DayOfWeek } from './types/DayOfWeek';
import { ScheduleFields } from './types/ScheduleFields';
import { ScheduleRecurrence } from './types/ScheduleRecurrence';
import { InvalidScheduleRecurrenceError, InvalidScheduleRecurrenceErrorCode } from './InvalidScheduleRecurrenceError';

const assertInRange = (label: string, value: number, min: number, max: number): void => {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new InvalidScheduleRecurrenceError(
      InvalidScheduleRecurrenceErrorCode.ValueOutOfRange,
      `Schedule ${label} must be a whole number between ${min} and ${max}, got ${value}.`,
    );
  }
};

/**
 * Reject an interval that does not divide its unit evenly.
 *
 * Not pedantry. AWS renders these as `0/n`, which restarts at the top of every
 * hour (or day), so `everyMinutes: 7` fires at :00 :07 ... :56 and then leaves
 * a four minute gap. The dev server matching the same field list would agree
 * with AWS, but neither would be what the author asked for, and the gap only
 * shows up in production at an awkward hour. An interval that divides evenly
 * means every consumer of these fields is saying the same thing.
 */
const assertDividesEvenly = (label: string, value: number, unit: number): void => {
  assertInRange(label, value, 1, unit);

  if (unit % value !== 0) {
    throw new InvalidScheduleRecurrenceError(
      InvalidScheduleRecurrenceErrorCode.IntervalDoesNotDivideEvenly,
      `Schedule ${label} must divide ${unit} evenly (got ${value}), or the interval would restart mid-cycle and leave an uneven gap. Valid values: ${everyDivisorOf(unit).join(', ')}.`,
    );
  }
};

const everyDivisorOf = (unit: number): number[] => Array.from({ length: unit }, (_, i) => i + 1).filter((n) => unit % n === 0);

// 0, n, 2n ... up to but not including the unit.
const stepsOf = (interval: number, unit: number): number[] => Array.from({ length: unit / interval }, (_, i) => i * interval);

const EVERY_VALUE: ScheduleFields = {
  minutes: [],
  hours: null,
  daysOfMonth: null,
  months: null,
  daysOfWeek: null,
};

/**
 * Turn a declared recurrence into the concrete field values both renderers
 * consume, validating it on the way through.
 *
 * The single interpreter of ScheduleRecurrence. quidproquo-deploy-awscdk and
 * quidproquo-dev-server both start from what this returns, which is what makes
 * "it fires locally exactly when it would fire deployed" a property of one
 * function rather than of two implementations agreeing.
 */
export const resolveScheduleFields = (recurrence: ScheduleRecurrence): ScheduleFields => {
  if ('everyMinutes' in recurrence) {
    assertDividesEvenly('everyMinutes', recurrence.everyMinutes, 60);

    return { ...EVERY_VALUE, minutes: stepsOf(recurrence.everyMinutes, 60) };
  }

  if ('everyHours' in recurrence) {
    assertDividesEvenly('everyHours', recurrence.everyHours, 24);

    const atMinute = recurrence.atMinute ?? 0;
    assertInRange('atMinute', atMinute, 0, 59);

    return { ...EVERY_VALUE, minutes: [atMinute], hours: stepsOf(recurrence.everyHours, 24) };
  }

  if ('dailyAtUtc' in recurrence) {
    const { hour, minute } = recurrence.dailyAtUtc;
    assertInRange('hour', hour, 0, 23);
    assertInRange('minute', minute, 0, 59);

    return { ...EVERY_VALUE, minutes: [minute], hours: [hour] };
  }

  if ('weeklyAtUtc' in recurrence) {
    const { day, hour, minute } = recurrence.weeklyAtUtc;
    assertInRange('day', day, DayOfWeek.Sunday, DayOfWeek.Saturday);
    assertInRange('hour', hour, 0, 23);
    assertInRange('minute', minute, 0, 59);

    return { ...EVERY_VALUE, minutes: [minute], hours: [hour], daysOfWeek: [day] };
  }

  if ('monthlyAtUtc' in recurrence) {
    const { dayOfMonth, hour, minute } = recurrence.monthlyAtUtc;

    // 29-31 are allowed and simply do not occur in every month, which is the
    // same behaviour AWS has. Worth knowing rather than worth refusing.
    assertInRange('dayOfMonth', dayOfMonth, 1, 31);
    assertInRange('hour', hour, 0, 23);
    assertInRange('minute', minute, 0, 59);

    return { ...EVERY_VALUE, minutes: [minute], hours: [hour], daysOfMonth: [dayOfMonth] };
  }

  throw new InvalidScheduleRecurrenceError(
    InvalidScheduleRecurrenceErrorCode.UnknownRecurrence,
    `Unrecognised schedule recurrence: ${JSON.stringify(recurrence)}.`,
  );
};
