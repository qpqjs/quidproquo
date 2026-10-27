import { Nullable, ScheduleFields } from 'quidproquo-core';

/**
 * The one place in the codebase that knows the AWS EventBridge cron dialect.
 *
 * Everything upstream describes a schedule as intent (`ScheduleRecurrence`)
 * resolved to plain field values (`ScheduleFields`). This turns those values
 * into the six-field expression EventBridge wants. The dev server renders the
 * same fields a different way, against a clock, and never sees any of this.
 */

// A contiguous run from 0 with a uniform step renders as `0/n`, which is how a
// person would have written it and how it reads back in the console. Anything
// else is a plain list. Purely cosmetic - the list form is always correct.
const renderValues = (values: Nullable<number[]>, unit: number, offset = 0): string => {
  if (values === null || values.length === 0) {
    return '*';
  }

  const shifted = values.map((value) => value + offset);

  if (shifted.length > 1) {
    const step = shifted[1] - shifted[0];
    const isUniformRunFromStart = shifted[0] === offset && shifted.length === unit / step && shifted.every((value, i) => value === offset + i * step);

    if (isUniformRunFromStart) {
      return step === 1 ? '*' : `${offset}/${step}`;
    }
  }

  return shifted.join(',');
};

export const renderAwsCronExpression = (fields: ScheduleFields): string => {
  // EventBridge refuses an expression that constrains both day-of-month and
  // day-of-week, and equally refuses `*` in both: exactly one of them has to
  // be `?`. So the choice is forced by which one the schedule actually cares
  // about, and day-of-month is the one that gives way when neither does.
  const usesDayOfWeek = fields.daysOfWeek !== null && fields.daysOfWeek.length > 0;

  const dayOfMonth = usesDayOfWeek ? '?' : renderValues(fields.daysOfMonth, 31);
  // AWS numbers day-of-week 1-7 for SUN-SAT; DayOfWeek is 0-6 Sunday-first, so
  // it shifts by one here rather than anywhere upstream.
  const dayOfWeek = usesDayOfWeek ? renderValues(fields.daysOfWeek, 7, 1) : '?';

  return [
    renderValues(fields.minutes, 60),
    renderValues(fields.hours, 24),
    dayOfMonth,
    renderValues(fields.months, 12),
    dayOfWeek,
    // Year. Nothing declares one, and `*` is what EventBridge expects for
    // "every", but the field is not optional.
    '*',
  ].join(' ');
};
