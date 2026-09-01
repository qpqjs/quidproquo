import { DayOfWeek } from './DayOfWeek';

/**
 * How often a recurring schedule runs, declared as intent rather than as a
 * cron string.
 *
 * Deliberately platform-neutral: an AWS EventBridge cron expression is one
 * RENDERING of this, produced in quidproquo-deploy-awscdk, and the dev server
 * matches the same declaration against the clock. Nothing here knows what a
 * `?` is.
 *
 * Every time is UTC. There is no local-timezone variant on purpose: the
 * deployed scheduler evaluates in UTC, so offering one would be a promise the
 * platform cannot keep.
 *
 * Deliberately absent, so the next reader does not take either for an
 * oversight:
 *
 * - **A year.** A recurrence pinned to a year is not recurring, it is a
 *   schedule with an expiry, and it fails by going quiet rather than by
 *   erroring. A one-shot at a date wants its own ScheduleTypeEnum member and
 *   its own define, not a field every existing caller has to leave as "any".
 * - **A month.** ScheduleFields carries `months` and both renderers honour it,
 *   but nothing here sets it yet - `yearlyAtUtc` is the obvious next variant
 *   and lands as a resolveScheduleFields change alone. Left out until
 *   something asks for it.
 *
 * This union is a closed set, which is the cost of dropping the raw cron
 * string: a consumer who needs something it cannot say has no local workaround
 * and has to wait for a release. Adding a variant is additive and cheap, so
 * add one rather than making anybody wait long.
 */
export type ScheduleRecurrence =
  // Must divide 60 - see resolveScheduleFields for why an awkward interval is
  // rejected rather than approximated.
  | { everyMinutes: number }

  // Must divide 24. `atMinute` defaults to 0.
  | { everyHours: number; atMinute?: number }
  | { dailyAtUtc: { hour: number; minute: number } }
  | { weeklyAtUtc: { day: DayOfWeek; hour: number; minute: number } }
  | { monthlyAtUtc: { dayOfMonth: number; hour: number; minute: number } };
