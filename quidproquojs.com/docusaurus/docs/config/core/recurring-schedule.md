---
title: defineRecurringSchedule
description: Define a recurring schedule, a trigger that runs a story on a timetable.
---

# defineRecurringSchedule

Defines a **recurring schedule**: a time-based trigger that runs a story on a timetable, with no incoming request. Use it for periodic work — nightly cleanups, polling, report generation, cache warming. Like a [queue](./queue.md) or [event bus](./event-bus.md), a schedule is an **event source**: each fire delivers a `ScheduledEvent` to the target story through the same [askProcessEvent](../../actions/core/event/ask-process-event.md) pipeline.

- **Locally:** the dev server ticks once a minute and runs any schedule whose recurrence matches that UTC minute. See [Locally](#locally) below.
- **On AWS:** deploys an **EventBridge rule** whose cron expression is rendered from the recurrence and a **consumer Lambda** as its target (`QpqCoreRecurringScheduleConstruct` in `quidproquo-deploy-awscdk`). The rule fires on the cron cadence and invokes the Lambda, passing the schedule's `metadata` as the event `detail`. The Lambda has a 15-minute timeout, and `maxConcurrentExecutions` (when set) becomes the Lambda's reserved concurrent executions.

```typescript
import { defineRecurringSchedule } from 'quidproquo-core';

export default [
  // Every day at 3am UTC
  defineRecurringSchedule({ dailyAtUtc: { hour: 3, minute: 0 } }, '/entry/schedule/onNightlyCleanup::onNightlyCleanup'),
];
```

## Signature

```typescript
function defineRecurringSchedule(
  recurrence: ScheduleRecurrence,
  runtime: QpqFunctionRuntime,
  options?: QPQConfigAdvancedScheduleSettings,
): ScheduleQPQConfigSetting;
```

## Parameters

### `recurrence` — `ScheduleRecurrence` (required)

When the schedule fires, declared as intent rather than as a cron string. It is deliberately platform-neutral: an AWS EventBridge cron expression is one *rendering* of it, produced at deploy time, and the dev server matches the same declaration against the clock.

| Recurrence | Fires |
| --- | --- |
| `{ everyMinutes: n }` | every `n` minutes, on the hour. `n` must divide 60 |
| `{ everyHours: n, atMinute?: m }` | every `n` hours at minute `m` (default 0). `n` must divide 24 |
| `{ dailyAtUtc: { hour, minute } }` | once a day |
| `{ weeklyAtUtc: { day, hour, minute } }` | once a week, `day` being a `DayOfWeek` |
| `{ monthlyAtUtc: { dayOfMonth, hour, minute } }` | once a month. A date past the end of a short month simply does not occur that month |

**Every time is UTC.** The deployed scheduler evaluates in UTC, so there is no local-timezone option: 3am in Brisbane is `{ dailyAtUtc: { hour: 17, minute: 0 } }`, and saying so in the config beats a comment that goes stale twice a year.

An interval that cannot be scheduled evenly (`{ everyMinutes: 7 }`) throws an `InvalidScheduleRecurrenceError` when the config is evaluated, so it fails at synth and at dev-server boot rather than at some unlucky hour in production. The reason it is refused rather than approximated: AWS renders an interval as `0/n`, which restarts at the top of every hour, so seven-minute steps would fire at :00 :07 ... :56 and then leave a four-minute gap.

### `runtime` — `QpqFunctionRuntime` (required)

The story to run each time the schedule fires. Usually a relative path string of the form `'/path/to/file::exportedFunctionName'`. This story's entry point is registered as a build source, and its `uniqueKey` (derived from the runtime) identifies the schedule.

### `options` — `QPQConfigAdvancedScheduleSettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `metadata` | `Record<string, any>` | `{}` | Arbitrary data attached to the schedule. On AWS it is passed through as the EventBridge target's `detail` and surfaces on the delivered event as `ScheduledEvent.metadata`. |
| `maxConcurrentExecutions` | `number` | – | Caps (and guarantees) the target Lambda's concurrent executions via reserved concurrency — never throttled below it, never scales above it. Carved out of the deploy account's shared concurrency pool. |
| `owner` | `CrossModuleOwner<'recurringSchedule'>` | – | Declares the schedule as owned by another module/service (cross-module resource naming). |
| `deprecated` | `boolean` | `false` | Marks the setting as deprecated in the config. |

## The delivered event: `ScheduledEvent`

Each fire delivers a `ScheduledEventParams` record to the target story:

```typescript
export interface ScheduledEventParams<T extends Record<string, any> = {}> {
  time: string;         // ISO time the schedule fired
  correlation: string;  // correlation id for this invocation
  metadata: T;          // the `metadata` you set on the schedule
}
```

- `time` — the event time reported by EventBridge.
- `correlation` — a correlation id for the invocation (the AWS request id on Lambda).
- `metadata` — the `metadata` object you passed to `defineRecurringSchedule`, typed by `T`.

```typescript
import { ScheduledEventParams } from 'quidproquo-core';

export function* onNightlyCleanup(event: ScheduledEventParams) {
  // event.time, event.correlation, event.metadata
  yield* askLogCreate(LogLevelEnum.Info, `cleanup fired at ${event.time}`);
}
```

## Examples

```typescript
import { defineRecurringSchedule } from 'quidproquo-core';

export default [
  // Poll an upstream every 10 minutes
  defineRecurringSchedule({ everyMinutes: 10 }, '/entry/schedule/onPoll::onPoll'),

  // Nightly report, capped to a single concurrent run, with metadata
  defineRecurringSchedule({ dailyAtUtc: { hour: 2, minute: 0 } }, '/entry/schedule/onNightlyReport::onNightlyReport', {
    maxConcurrentExecutions: 1,
    metadata: { report: 'daily-summary' },
  }),
];
```

## Locally

The dev server arms every schedule its services own and ticks once a minute, running any whose recurrence matches that UTC minute. It lists what it armed at boot:

```
[schedule] 2 schedule(s) armed (utc):
[schedule]   flow/onPoll {"everyMinutes":10}
[schedule]   flow/onNightlyReport {"dailyAtUtc":{"hour":2,"minute":0}}
```

## Related

- [askProcessEvent](../../actions/core/event/ask-process-event.md) — the pipeline that runs the target story for each schedule fire.
- [defineQueue](./queue.md) and [defineEventBus](./event-bus.md) — the other core event sources.
- [defineDeployEvent](./deploy-event.md) — a related time/lifecycle-based trigger that runs at deploy time rather than on a timetable.
- **AWS implementation:** `QpqCoreRecurringScheduleConstruct` (EventBridge rule + target Lambda) in `quidproquo-deploy-awscdk`. `renderAwsCronExpression`, alongside it, is the only place in the codebase that knows the EventBridge cron dialect.
