import { Nullable } from '../../../../types';

/**
 * A resolved recurrence, as concrete field values.
 *
 * The one shape both renderers consume: quidproquo-deploy-awscdk turns it into
 * an EventBridge cron expression, the dev server asks whether it matches a
 * given UTC minute. Adding a ScheduleRecurrence variant means teaching
 * resolveScheduleFields about it and nothing else.
 *
 * `null` means "every", which is not the same as listing every value: it is
 * what lets the cron renderer emit `*`, and what tells it which of
 * day-of-month / day-of-week should become AWS's `?`.
 *
 * `minutes` is never null, because a schedule that fires every minute of every
 * hour still fires ON a minute.
 */
export type ScheduleFields = {
  // 0-59
  minutes: number[];

  // 0-23
  hours: Nullable<number[]>;

  // 1-31
  daysOfMonth: Nullable<number[]>;

  // 1-12
  months: Nullable<number[]>;

  // 0-6, Sunday first (see DayOfWeek)
  daysOfWeek: Nullable<number[]>;
};
