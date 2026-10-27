---
title: askEventBusSendMessages
description: Publish one or more messages to an event bus for its subscribers to consume.
---

# askEventBusSendMessages

Publishes one or more messages to an [event bus](../../../config/core/event-bus.md). Every queue subscribed to the bus receives each message and runs its consumer story. Publishing is fire-and-forget — the action returns once the messages are accepted, not when subscribers finish.

- **Action type:** `EventBusActionType.SendMessages`

```typescript
import { askEventBusSendMessages } from '@qpqjs/core';

export function* onUserRegistered(user: { id: string; email: string }) {
  yield* askEventBusSendMessages({
    eventBusName: 'domain-events',
    eventBusMessages: [
      { type: 'user.created', payload: { userId: user.id, email: user.email } },
    ],
  });
}
```

## Signature

```typescript
function* askEventBusSendMessages<T>(
  eventBusSendMessageOptions: EventBusSendMessageOptions<T>,
): AskResponse<void>;
```

## Parameters

### `eventBusSendMessageOptions` — `EventBusSendMessageOptions<T>` (required)

```typescript
export interface EventBusSendMessageOptions<T> {
  eventBusName: string;
  eventBusMessages: EventBusMessage<T>[];
}
```

| Property | Type | Description |
| --- | --- | --- |
| `eventBusName` | `string` | Name of the bus to publish to — must match a bus declared with [defineEventBus](../../../config/core/event-bus.md) (or one shared via its `owner` option). |
| `eventBusMessages` | `EventBusMessage<T>[]` | The messages to publish. |

### `EventBusMessage<T>`

```typescript
export type EventBusMessage<T> = {
  type: string;
  payload: T;
  groupId?: string;
  deduplicationId?: string;
};
```

| Property | Type | Description |
| --- | --- | --- |
| `type` | `string` | The message type. Subscribing queues match this against their processor patterns to pick a consumer story. |
| `payload` | `T` | The message body, serialized as JSON on the wire. |
| `groupId` | `string` (optional) | **FIFO buses only.** Messages sharing a group are delivered in order. Defaults to the bus name (global ordering). Ignored on non-FIFO buses. |
| `deduplicationId` | `string` (optional) | **FIFO buses only.** Suppresses duplicate publishes within SNS's 5-minute window. Defaults to a generated uuid (no deduplication). Ignored on non-FIFO buses. |

## Returns

`void` — the action completes once the messages are accepted by the bus. It does not wait for subscribers.

## Errors

| Error | Meaning |
| --- | --- |
| `EventBusSendMessagesErrorTypeEnum.AccessDenied` | The caller lacks permission to publish to the topic. |
| `EventBusSendMessagesErrorTypeEnum.TopicNotFound` | The underlying topic does not exist. |
| `EventBusSendMessagesErrorTypeEnum.ServiceUnavailable` | Internal error or throttling from the messaging service. |

Errors thrown by actions can be caught with `askCatch` from @qpqjs/core. It returns an `EitherActionResult` — `{ success: true, result }` on success, or `{ success: false, error }` on failure:

```typescript
const outcome = yield* askCatch(
  askEventBusSendMessages({
    eventBusName: 'domain-events',
    eventBusMessages: [{ type: 'user.created', payload: { userId } }],
  }),
);

if (!outcome.success) {
  // outcome.error.errorType / outcome.error.errorText
}
```

## Notes

- On AWS the bus is an SNS topic; messages are published with the caller's story session attached, which the pipeline restores when the subscriber's story runs.
- For FIFO ordering, set `groupId` per message to control which messages must stay ordered relative to each other.

## Related

- [defineEventBus](../../../config/core/event-bus.md) — declares the bus this action publishes to.
- [defineQueue](../../../config/core/queue.md) — a queue subscribes to a bus (via `eventBusSubscriptions`) to consume its messages.
- [askQueueSendMessages](../queue/ask-queue-send-messages.md) — send directly to a specific queue instead of fanning out through a bus.
- [askProcessEvent](../event/ask-process-event.md) — the pipeline that delivers published messages to consumer stories and preserves FIFO group ordering.
