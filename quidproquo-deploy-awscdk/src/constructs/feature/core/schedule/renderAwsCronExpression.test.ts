import { DayOfWeek, resolveScheduleFields, ScheduleRecurrence } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { renderAwsCronExpression } from './renderAwsCronExpression';

const render = (recurrence: ScheduleRecurrence): string => renderAwsCronExpression(resolveScheduleFields(recurrence));

describe('renderAwsCronExpression', () => {
  it('renders a step interval the way a person would write it', () => {
    expect(render({ everyMinutes: 10 })).toBe('0/10 * * * ? *');
  });

  it('renders every-minute as a bare star rather than 0/1', () => {
    expect(render({ everyMinutes: 1 })).toBe('* * * * ? *');
  });

  it('renders an hourly step', () => {
    expect(render({ everyHours: 6 })).toBe('0 0/6 * * ? *');
  });

  it('renders a fixed daily time', () => {
    expect(render({ dailyAtUtc: { hour: 17, minute: 5 } })).toBe('5 17 * * ? *');
  });

  it('shifts day-of-week into the AWS 1-7 numbering', () => {
    // DayOfWeek.Monday is 1 (JS, Sunday-first); AWS wants 2 (1 is SUN).
    expect(render({ weeklyAtUtc: { day: DayOfWeek.Monday, hour: 2, minute: 0 } })).toBe('0 2 ? * 2 *');
    expect(render({ weeklyAtUtc: { day: DayOfWeek.Sunday, hour: 2, minute: 0 } })).toBe('0 2 ? * 1 *');
    expect(render({ weeklyAtUtc: { day: DayOfWeek.Saturday, hour: 2, minute: 0 } })).toBe('0 2 ? * 7 *');
  });

  it('renders a fixed day of the month', () => {
    expect(render({ monthlyAtUtc: { dayOfMonth: 15, hour: 9, minute: 30 } })).toBe('30 9 15 * ? *');
  });

  it('always has six fields', () => {
    const recurrences: ScheduleRecurrence[] = [
      { everyMinutes: 5 },
      { everyHours: 3, atMinute: 15 },
      { dailyAtUtc: { hour: 0, minute: 0 } },
      { weeklyAtUtc: { day: DayOfWeek.Friday, hour: 23, minute: 59 } },
      { monthlyAtUtc: { dayOfMonth: 1, hour: 12, minute: 0 } },
    ];

    for (const recurrence of recurrences) {
      expect(render(recurrence).split(' ')).toHaveLength(6);
    }
  });

  describe('the day-of-month / day-of-week rule', () => {
    // EventBridge rejects an expression that constrains both, and equally
    // rejects `*` in both. Exactly one is always `?`.
    const recurrences: ScheduleRecurrence[] = [
      { everyMinutes: 5 },
      { everyHours: 4 },
      { dailyAtUtc: { hour: 1, minute: 1 } },
      { weeklyAtUtc: { day: DayOfWeek.Wednesday, hour: 1, minute: 1 } },
      { monthlyAtUtc: { dayOfMonth: 28, hour: 1, minute: 1 } },
    ];

    it('marks exactly one of them as ?', () => {
      for (const recurrence of recurrences) {
        const [, , dayOfMonth, , dayOfWeek] = render(recurrence).split(' ');

        expect([dayOfMonth, dayOfWeek].filter((field) => field === '?')).toHaveLength(1);
      }
    });
  });
});

// Exhaustive spot checks, as a table. The named tests above say what each rule
// IS; this says what every input actually produces, so a change to the
// renderer cannot quietly move an expression that nothing happened to name.
//
// Every divisor of 60 and of 24 is here on purpose: those are exactly the
// intervals resolveScheduleFields accepts, so between them the table covers
// the whole legal interval space rather than a sample of it.
const scheduleRecurrenceCronCases: Array<[ScheduleRecurrence, string]> = [
  // --- everyMinutes: all divisors of 60 ---
  [{ everyMinutes: 1 }, '* * * * ? *'], // a step of 1 IS every, so it collapses
  [{ everyMinutes: 2 }, '0/2 * * * ? *'],
  [{ everyMinutes: 3 }, '0/3 * * * ? *'],
  [{ everyMinutes: 4 }, '0/4 * * * ? *'],
  [{ everyMinutes: 5 }, '0/5 * * * ? *'],
  [{ everyMinutes: 6 }, '0/6 * * * ? *'],
  [{ everyMinutes: 10 }, '0/10 * * * ? *'],
  [{ everyMinutes: 12 }, '0/12 * * * ? *'],
  [{ everyMinutes: 15 }, '0/15 * * * ? *'],
  [{ everyMinutes: 20 }, '0/20 * * * ? *'],
  [{ everyMinutes: 30 }, '0/30 * * * ? *'],
  [{ everyMinutes: 60 }, '0 * * * ? *'], // collapses to hourly on the hour

  // --- everyHours: all divisors of 24, default atMinute (0) ---
  [{ everyHours: 1 }, '0 * * * ? *'], // same collapse in the hours field
  [{ everyHours: 2 }, '0 0/2 * * ? *'],
  [{ everyHours: 3 }, '0 0/3 * * ? *'],
  [{ everyHours: 4 }, '0 0/4 * * ? *'],
  [{ everyHours: 6 }, '0 0/6 * * ? *'],
  [{ everyHours: 8 }, '0 0/8 * * ? *'],
  [{ everyHours: 12 }, '0 0/12 * * ? *'],
  [{ everyHours: 24 }, '0 0 * * ? *'], // collapses to once daily at atMinute

  // --- everyHours: explicit atMinute, spot-checked across a few divisors ---
  [{ everyHours: 1, atMinute: 30 }, '30 * * * ? *'],
  [{ everyHours: 4, atMinute: 15 }, '15 0/4 * * ? *'],
  [{ everyHours: 6, atMinute: 45 }, '45 0/6 * * ? *'],
  [{ everyHours: 12, atMinute: 59 }, '59 0/12 * * ? *'],
  [{ everyHours: 24, atMinute: 0 }, '0 0 * * ? *'], // explicit 0 same as default

  // --- dailyAtUtc: boundary + mid-range hour/minute values ---
  [{ dailyAtUtc: { hour: 0, minute: 0 } }, '0 0 * * ? *'],
  [{ dailyAtUtc: { hour: 23, minute: 59 } }, '59 23 * * ? *'],
  [{ dailyAtUtc: { hour: 12, minute: 30 } }, '30 12 * * ? *'],
  [{ dailyAtUtc: { hour: 9, minute: 5 } }, '5 9 * * ? *'],

  // --- weeklyAtUtc: every day of week. DayOfWeek is JS numbering (Sunday 0),
  //     AWS is 1-7 with SUN as 1, so every row here is shifted by one ---
  [{ weeklyAtUtc: { day: DayOfWeek.Sunday, hour: 2, minute: 0 } }, '0 2 ? * 1 *'],
  [{ weeklyAtUtc: { day: DayOfWeek.Monday, hour: 2, minute: 0 } }, '0 2 ? * 2 *'],
  [{ weeklyAtUtc: { day: DayOfWeek.Tuesday, hour: 2, minute: 0 } }, '0 2 ? * 3 *'],
  [{ weeklyAtUtc: { day: DayOfWeek.Wednesday, hour: 2, minute: 0 } }, '0 2 ? * 4 *'],
  [{ weeklyAtUtc: { day: DayOfWeek.Thursday, hour: 2, minute: 0 } }, '0 2 ? * 5 *'],
  [{ weeklyAtUtc: { day: DayOfWeek.Friday, hour: 2, minute: 0 } }, '0 2 ? * 6 *'],
  [{ weeklyAtUtc: { day: DayOfWeek.Saturday, hour: 2, minute: 0 } }, '0 2 ? * 7 *'],

  // --- weeklyAtUtc: boundary hour/minute values on a fixed day ---
  [{ weeklyAtUtc: { day: DayOfWeek.Friday, hour: 0, minute: 0 } }, '0 0 ? * 6 *'],
  [{ weeklyAtUtc: { day: DayOfWeek.Friday, hour: 23, minute: 59 } }, '59 23 ? * 6 *'],

  // --- monthlyAtUtc: boundary + typical dayOfMonth values ---
  [{ monthlyAtUtc: { dayOfMonth: 1, hour: 0, minute: 0 } }, '0 0 1 * ? *'],
  [{ monthlyAtUtc: { dayOfMonth: 15, hour: 12, minute: 30 } }, '30 12 15 * ? *'],
  [{ monthlyAtUtc: { dayOfMonth: 28, hour: 6, minute: 0 } }, '0 6 28 * ? *'],
  [{ monthlyAtUtc: { dayOfMonth: 31, hour: 23, minute: 59 } }, '59 23 31 * ? *'],
];

describe('renderAwsCronExpression spot checks', () => {
  it.each(scheduleRecurrenceCronCases)('renders %j as %s', (recurrence: ScheduleRecurrence, expected: string) => {
    expect(render(recurrence)).toBe(expected);
  });
});
