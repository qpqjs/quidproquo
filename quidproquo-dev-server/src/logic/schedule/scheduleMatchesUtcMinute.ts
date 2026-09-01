import { Nullable, ScheduleFields } from 'quidproquo-core';

// null means "every", so an absent field always matches. That is the whole
// reason ScheduleFields uses null rather than listing every value: it keeps
// this check and the cron renderer's `*` the same decision.
const matches = (values: Nullable<number[]>, value: number): boolean => values === null || values.includes(value);

/**
 * Does this schedule fire during the UTC minute `at` falls in?
 *
 * The dev server's half of the parity claim: the same `ScheduleFields` the
 * cron renderer turns into an EventBridge expression, evaluated directly
 * against a clock. Seconds and milliseconds are ignored, because a schedule
 * fires on a minute and the ticker asks once per minute.
 *
 * UTC throughout, matching the deployed scheduler. Using local time here would
 * make a dev machine's timezone part of the behaviour.
 *
 * Day-of-month and day-of-week are ANDed, not ORed. Cron traditionally ORs
 * them when both are constrained, but a resolved recurrence never constrains
 * both (see resolveScheduleFields), so there is no case where the two rules
 * disagree - and AND is the one that stays right if a variant ever does.
 */
export const scheduleMatchesUtcMinute = (fields: ScheduleFields, at: Date): boolean => {
  return (
    matches(fields.minutes, at.getUTCMinutes()) &&
    matches(fields.hours, at.getUTCHours()) &&
    matches(fields.daysOfMonth, at.getUTCDate()) &&
    // getUTCMonth is 0-11; ScheduleFields months are 1-12, as a person writes them.
    matches(fields.months, at.getUTCMonth() + 1) &&
    matches(fields.daysOfWeek, at.getUTCDay())
  );
};
