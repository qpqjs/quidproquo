import { QpqFunctionRuntime } from '../../../types';
import { QPQCoreConfigSettingType } from '../../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../../utils/crossModuleUtils';
import { getStoryNameFromQpqFunctionRuntime } from '../../utils/qpqFunctionRuntimeUtils';
import { QPQConfigAdvancedScheduleSettings } from './types/QPQConfigAdvancedScheduleSettings';
import { ScheduleQPQConfigSetting } from './types/ScheduleQPQConfigSetting';
import { ScheduleRecurrence } from './types/ScheduleRecurrence';
import { ScheduleTypeEnum } from './types/ScheduleTypeEnum';
import { resolveScheduleFields } from './resolveScheduleFields';

/**
 * Run a story on a recurring timetable.
 *
 * The recurrence is declared as intent, not as a cron string. Deployed, it is
 * rendered to an AWS EventBridge cron expression; locally, the dev server's
 * ticker matches the same declaration against the clock. Neither behaviour is
 * a special case of the other, which is the point.
 *
 * **Every time is UTC.** The deployed scheduler evaluates in UTC, so there is
 * no local-timezone option: a schedule that reads `{ dailyAtUtc: { hour: 17 } }`
 * is 3am in Brisbane, and saying so in the config is better than a comment
 * that drifts out of date twice a year.
 *
 * ```ts
 * // every ten minutes
 * defineRecurringSchedule({ everyMinutes: 10 }, '/entry/schedule/onPoll::onPoll')
 *
 * // 5pm UTC daily
 * defineRecurringSchedule({ dailyAtUtc: { hour: 17, minute: 0 } }, '/entry/schedule/onNightly::onNightly')
 *
 * // 2am UTC every Monday
 * defineRecurringSchedule(
 *   { weeklyAtUtc: { day: DayOfWeek.Monday, hour: 2, minute: 0 } },
 *   '/entry/schedule/onDigest::onDigest',
 * )
 * ```
 *
 * An interval that cannot be scheduled evenly (`{ everyMinutes: 7 }`) throws
 * an `InvalidScheduleRecurrenceError` here, while the config is being
 * evaluated, so it fails at synth and at dev-server boot rather than at some
 * unlucky hour in production.
 */
export const defineRecurringSchedule = (
  recurrence: ScheduleRecurrence,
  runtime: QpqFunctionRuntime,
  options?: QPQConfigAdvancedScheduleSettings,
): ScheduleQPQConfigSetting => {
  // Resolved and discarded: this is here to validate. Both renderers resolve
  // it again for themselves, so storing the fields would be a second copy of
  // the truth that could drift from the declaration beside it.
  resolveScheduleFields(recurrence);

  return {
    configSettingType: QPQCoreConfigSettingType.schedule,
    uniqueKey: getStoryNameFromQpqFunctionRuntime(runtime),

    scheduleType: ScheduleTypeEnum.Recurring,

    runtime,

    recurrence,

    metadata: options?.metadata || {},

    maxConcurrentExecutions: options?.maxConcurrentExecutions,

    owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
  };
};
