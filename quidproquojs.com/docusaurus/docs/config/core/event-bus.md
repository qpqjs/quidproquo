---
title: defineEventBus
description: Define an event bus — a named pub/sub topic that stories publish messages to and queues subscribe to.
---

# defineEventBus

Defines an **event bus**: a named publish/subscribe channel. Stories publish messages to a bus by name with [askEventBusSendMessages](../../actions/core/event-bus/ask-event-bus-send-messages.md); any number of [queues](./queue.md) subscribe to the bus (via their `eventBusSubscriptions` option) and their consumer stories run for each delivered message. Publishers never know who is listening.

- **On AWS:** deploys an **SNS topic** (`QpqCoreEventBusConstruct` in `@qpqjs/deploy-awscdk`). The topic allows cross-account subscription and lets CloudWatch alarms publish to it. When `isFifo` is `true` a FIFO SNS topic is created (`.fifo` suffix); content-based deduplication is left off (dedup ids are set explicitly at publish time). Subscriptions are wired up from the subscribing queue's side.

```typescript
import { defineEventBus } from '@qpqjs/core';

export default [
  defineEventBus('domain-events'),
];
```

## Signature

```typescript
function defineEventBus(
  name: string,
  options?: QPQConfigAdvancedEventBusSettings,
): EventBusQPQConfigSetting;
```

## Parameters

### `name` — `string` (required)

The name of the bus. This is the name you pass to [askEventBusSendMessages](../../actions/core/event-bus/ask-event-bus-send-messages.md) and the name queues reference in their `eventBusSubscriptions`. It is the bus's `uniqueKey`, and on AWS it derives the physical topic name (prefixed with application/module/environment so the same config deploys cleanly to multiple environments).

### `options` — `QPQConfigAdvancedEventBusSettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `isFifo` | `boolean` | `false` | Creates a **FIFO** event bus that preserves per-group ordering and supports message deduplication. See [FIFO event buses](#fifo-event-buses). |
| `owner` | `CrossModuleOwner<'eventBusName'>` | – | Declares that this bus is owned by **another** module/service. Use this to publish to a bus deployed elsewhere: the deploy grants this service IAM publish access to the foreign topic instead of creating a new one. `{ module, application, feature, environment, eventBusName }` — all optional; unset parts default to the current service. |
| `deprecated` | `boolean` | `false` | Marks the bus as deprecated in the config. |

## FIFO event buses

Setting `isFifo: true` deploys a FIFO SNS topic. Ordering and deduplication are then controlled per message when you publish, via the `groupId` and `deduplicationId` fields on each `EventBusMessage` (see [askEventBusSendMessages](../../actions/core/event-bus/ask-event-bus-send-messages.md)):

- Messages with the same `groupId` are delivered in order. If you don't set one, it defaults to the bus name (global ordering across the whole bus).
- `deduplicationId` suppresses duplicate publishes within SNS's 5-minute window. If you don't set one, a unique id is generated per send (no deduplication).

On the consuming side, a FIFO queue subscribed to a FIFO bus processes records one group at a time using [askProcessEventWithGroupOrdering](../../actions/core/event/ask-process-event.md), so a failed message blocks only its own group.

Note: FIFO SNS topics only support SQS subscriptions — direct email/URL fan-out (`defineEventBusQuickSubscription`, an AWS-specific setting) is rejected at deploy time for a FIFO bus. A FIFO queue may only subscribe to a FIFO bus (validated at deploy).

## Examples

```typescript
import { defineEventBus, defineQueue } from '@qpqjs/core';

export default [
  // A standard fan-out bus
  defineEventBus('domain-events'),

  // A FIFO bus for ordered, per-entity event streams
  defineEventBus('account-events', { isFifo: true }),

  // Publish to a bus owned by another service
  defineEventBus('billing-events', {
    owner: { module: 'billing-service' },
  }),

  // A queue that consumes from the bus
  defineQueue('domain-events-consumer', {
    'user.created': '/entry/queue/onUserCreated::onUserCreated',
  }, {
    eventBusSubscriptions: ['domain-events'],
  }),
];
```

## Related

- [askEventBusSendMessages](../../actions/core/event-bus/ask-event-bus-send-messages.md) — publishes messages to a bus declared here.
- [defineQueue](./queue.md) — declares a queue that subscribes to a bus via `eventBusSubscriptions`.
- [askProcessEvent](../../actions/core/event/ask-process-event.md) — the pipeline that dispatches delivered messages to consumer stories (and preserves FIFO group ordering).
- [defineRecurringSchedule](./recurring-schedule.md) and [defineNotifyError](./notify-error.md) — other event sources; a notify-error publishes alarm-state changes to a bus declared here.
- [defineEventBusQuickSubscription](../config-aws/event-bus-quick-subscription.md) — attach direct SNS email/webhook subscribers to a bus on AWS (no compute), for using it as an alert channel.
- [defineAwsAlarm](../config-aws/aws-alarm.md) — publishes CloudWatch alarm state to a bus via `onAlarm.publishToEventBus`.
- **AWS implementation:** `QpqCoreEventBusConstruct` (SNS topic, subscriptions, IAM) in `@qpqjs/deploy-awscdk`; the send-message processor in `@qpqjs/actionprocessor-aws`.
