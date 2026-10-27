---
title: defineNotifyError
description: Define an error notifier — watches a service's failures via CloudWatch alarms and publishes state changes to event buses so a story can react.
---

# defineNotifyError

Defines an **error notifier**: it watches the service's Lambda failures and, when they cross a threshold, publishes an alarm-state change to one or more [event buses](./event-bus.md). Subscribe a [queue](./queue.md) to those buses and its consumer story receives a `NotifyErrorQueueEvent` describing the alarm — the mechanism that turns runtime errors and throttles into a reactive notification (page a channel, open a ticket, etc.) processed through the standard [askProcessEvent](../../actions/core/event/ask-process-event.md) pipeline.

- **On AWS:** deploys two **CloudWatch alarms** (`QpqCoreNotifyErrorConstruct` in `@qpqjs/deploy-aws`) on the `AWS/Lambda` namespace — one on the `Errors` metric and one on the `Throttles` metric, each with a 60-second period and a threshold of 1 (fires when at least one error/throttle occurs in the period). For every event bus named in `onAlarm.publishToEventBus`, an SNS alarm action is added that publishes the alarm-state change to that bus's SNS topic. A queue subscribed to the bus then delivers the message to your handler story.

```typescript
import { defineNotifyError, defineEventBus, defineQueue } from '@qpqjs/core';
import { NotifyErrorQueueEvents } from '@qpqjs/core';

export default [
  defineNotifyError('service-errors', {
    onAlarm: { publishToEventBus: ['ops-alerts'] },
  }),
  defineEventBus('ops-alerts'),
  defineQueue('ops-alerts-handler', {
    [NotifyErrorQueueEvents.Error]: '/entry/queue/onServiceError::onServiceError',
    [NotifyErrorQueueEvents.Throttle]: '/entry/queue/onServiceThrottle::onServiceThrottle',
  }, {
    eventBusSubscriptions: ['ops-alerts'],
  }),
];
```

## Signature

```typescript
function defineNotifyError(
  name: string,
  options?: QPQConfigAdvancedNotifyErrorSettings,
): NotifyErrorQPQConfigSetting;
```

## Parameters

### `name` — `string` (required)

The name of the error notifier. This is the notifier's `uniqueKey`, and on AWS it derives the alarm names (`<name>-error` and `<name>-throttle`).

### `options` — `QPQConfigAdvancedNotifyErrorSettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `onAlarm.publishToEventBus` | `string[]` | – | Names of [event buses](./event-bus.md) to publish alarm-state changes to. Each named bus gets an SNS alarm action on both the error and throttle alarms. Subscribe a queue to these buses to run a handler story. |

## The delivered event: `NotifyErrorQueueEvent`

When a subscribed queue delivers the alarm, the consumer story receives a [QueueEvent](./queue.md) whose `message` is one of the notify-error message types, discriminated by `type`:

```typescript
export enum NotifyErrorQueueEvents {
  Error = 'Error',
  Timeout = 'Timeout',
  Throttle = 'Throttle',
  Unknown = 'Unknown',
}

// message.payload (shared across the message types)
export type NotifyErrorQueueBaseEventPayload = {
  newStateInAlarm: boolean;  // true when the alarm has just entered the ALARM state
  newStateReason: string;    // human-readable reason for the new state
  oldStateInAlarm: boolean;  // whether the alarm was previously in the ALARM state
};
```

- `NotifyErrorQueueEvents.Error` (`NotifyErrorQueueErrorEventMessage`) — the error-rate alarm changed state.
- `NotifyErrorQueueEvents.Throttle` (`NotifyErrorQueueThrottleEventMessage`) — the throttle alarm changed state.
- `NotifyErrorQueueEvents.Timeout` / `NotifyErrorQueueEvents.Unknown` — additional message types the union defines; the AWS construct currently emits only the error and throttle alarms.

Key each queue processor by the message `type` (using the `NotifyErrorQueueEvents` enum members) to route each alarm to the right handler story.

## Examples

```typescript
import { defineNotifyError } from '@qpqjs/core';

export default [
  // Watch this service and fan alarm changes out to two buses
  defineNotifyError('payments-errors', {
    onAlarm: { publishToEventBus: ['ops-alerts', 'oncall'] },
  }),
];
```

## Related

- [defineEventBus](./event-bus.md) — the bus alarm-state changes are published to.
- [defineQueue](./queue.md) — subscribe a queue to the bus (`eventBusSubscriptions`) and key its processors by `NotifyErrorQueueEvents` to handle each alarm.
- [askProcessEvent](../../actions/core/event/ask-process-event.md) — the pipeline that runs the handler story for the delivered message.
- [defineAwsAlarm](../config-aws/aws-alarm.md) — declare an additional custom CloudWatch alarm beyond the default per-resource ones.
- [defineAwsServiceDashboard](../config-aws/aws-service-dashboard.md) — its latency anomaly alarms route via this notify-error configuration.
- **AWS implementation:** `QpqCoreNotifyErrorConstruct` (CloudWatch alarms + SNS alarm actions) in `@qpqjs/deploy-aws`.
