---
title: defineEventBusQuickSubscription
description: Attach direct SNS email or webhook subscribers to an event bus, with no compute in between.
---

# defineEventBusQuickSubscription

Attaches **direct SNS subscribers** — an email address or an incident-tool webhook URL — to a core [event bus](../core/event-bus.md), with no queue or Lambda in between. It's for a bus used as an alert channel: messages published to the bus (for example alarm-state changes routed via `onAlarm.publishToEventBus`) reach a human out-of-band, without depending on the service's own compute being healthy. For rich, in-band handling, use the normal bus → queue → function pattern instead.

This is an AWS-specific convenience — direct email/webhook delivery is an SNS feature, not a portable event-bus concept — which is why it lives in `@qpqjs/config-aws` rather than on core's [`defineEventBus`](../core/event-bus.md).

- **On AWS:** resolved by `getEventBusQuickSubscriptions` and applied in `QpqCoreEventBusConstruct` (`@qpqjs/deploy-awscdk`) to the bus's SNS topic. An `email` subscription adds an `EmailSubscription`; a `url` subscription adds a `UrlSubscription` (http vs https auto-detected from the URL). Multiple calls for the same bus are additive. Quick subscriptions are **not** supported on FIFO event buses (SNS FIFO topics only allow SQS subscriptions) — declaring one there fails the deploy.

```typescript
import { defineEventBus } from '@qpqjs/core';
import { defineEventBusQuickSubscription, EventBusQuickSubscriptionType } from '@qpqjs/config-aws';

export default [
  defineEventBus('ops-alerts'),

  defineEventBusQuickSubscription('ops-alerts', [
    { type: EventBusQuickSubscriptionType.email, email: 'oncall@example.com' },
  ]),
];
```

## Signature

```typescript
function defineEventBusQuickSubscription(
  eventBusName: string,
  subscriptions: EventBusQuickSubscription[],
  options?: QPQConfigAdvancedEventBusQuickSubscriptionSettings,
): EventBusQuickSubscriptionQPQConfigSetting;
```

## Parameters

### `eventBusName` — `string` (required)

The name of the event bus to attach subscribers to (the setting's `uniqueKey`). Matches the name passed to `defineEventBus`.

### `subscriptions` — `EventBusQuickSubscription[]` (required)

The endpoints SNS delivers to directly. Each is a discriminated union on `type`:

```typescript
type EventBusQuickSubscription =
  | { type: EventBusQuickSubscriptionType.email; email: string }
  | { type: EventBusQuickSubscriptionType.url; url: string };
```

| `type` | Field | Delivery |
| --- | --- | --- |
| `EventBusQuickSubscriptionType.email` | `email` | Sends an email to the address (SNS email confirmation applies). |
| `EventBusQuickSubscriptionType.url` | `url` | POSTs to an incident-tool webhook (PagerDuty / Slack / OpsGenie); http/https auto-detected from the URL prefix. |

### `options` — `QPQConfigAdvancedEventBusQuickSubscriptionSettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `owner` | `CrossModuleOwner<'eventBusName'>` | – | The module that owns the target bus when it lives in another service (mirror the `owner` you pass to `defineEventBus`). The subscription then binds only to that owner's bus, so a same-named bus owned by a different module won't accidentally pick it up. Omit for a bus owned by this service. |

## Examples

```typescript
import { defineEventBus } from '@qpqjs/core';
import { defineEventBusQuickSubscription, EventBusQuickSubscriptionType } from '@qpqjs/config-aws';

export default [
  defineEventBus('ops-alerts'),

  // Email plus a Slack/PagerDuty webhook — additive across calls
  defineEventBusQuickSubscription('ops-alerts', [
    { type: EventBusQuickSubscriptionType.email, email: 'oncall@example.com' },
    { type: EventBusQuickSubscriptionType.url, url: 'https://hooks.example.com/incident' },
  ]),
];
```

## Related

- [defineEventBus](../core/event-bus.md) — the core bus these subscribers attach to.
- [defineAwsAlarm](./aws-alarm.md) — publish alarm state to the bus (via `onAlarm.publishToEventBus`) so these subscribers get notified.
