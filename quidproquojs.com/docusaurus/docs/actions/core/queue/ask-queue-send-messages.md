---
title: askQueueSendMessages
description: Enqueue one or more messages onto a queue for its consumer stories to process asynchronously.
---

# askQueueSendMessages

Enqueues one or more messages onto a [queue](../../../config/core/queue.md). Each message is delivered asynchronously to the consumer story whose processor pattern matches the message's `type`. Sending is fire-and-forget — the action returns once the messages are accepted, not when they are processed.

- **Action type:** `QueueActionType.SendMessages`

```typescript
import { askQueueSendMessages } from '@qpqjs/core';

export function* scheduleWelcomeEmail(user: { id: string; email: string }) {
  yield* askQueueSendMessages('emails',
    { type: 'email.welcome', payload: { userId: user.id, to: user.email } },
  );
}
```

## Signature

```typescript
function* askQueueSendMessages<T extends QueueMessage<any>>(
  queueName: string,
  ...queueMessages: T[]
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `queueName` | `string` | Name of the queue to send to — must match a queue declared with [defineQueue](../../../config/core/queue.md) (or one shared via its `owner` option). |
| `...queueMessages` | `QueueMessage<T>[]` | One or more messages to enqueue, passed as rest arguments. |

### `QueueMessage<T>`

```typescript
export type QueueMessage<T> = {
  type: string;
  payload: T;
  groupId?: string;
  deduplicationId?: string;
};
```

| Property | Type | Description |
| --- | --- | --- |
| `type` | `string` | The message type. The queue matches this against its processor patterns (from [defineQueue](../../../config/core/queue.md)) to pick the consumer story. |
| `payload` | `T` | The message body, serialized as JSON on the wire. |
| `groupId` | `string` (optional) | **FIFO queues only.** Messages sharing a group are processed in order. Defaults to the queue name (global ordering). Ignored on non-FIFO queues. |
| `deduplicationId` | `string` (optional) | **FIFO queues only.** Suppresses duplicate sends within SQS's 5-minute window. Defaults to a generated uuid (no deduplication). Ignored on non-FIFO queues. |

## Returns

`void` — the action completes once the messages are accepted by the queue. It does not wait for the consumer stories.

## Errors

| Error | Meaning |
| --- | --- |
| `QueueSendMessagesErrorTypeEnum.AccessDenied` | The caller lacks permission to send to the queue. |
| `QueueSendMessagesErrorTypeEnum.QueueNotFound` | The underlying queue does not exist. |
| `QueueSendMessagesErrorTypeEnum.ServiceUnavailable` | Internal error or throttling from the messaging service. |

Errors thrown by actions can be caught with `askCatch` from @qpqjs/core. It returns an `EitherActionResult` — `{ success: true, result }` on success, or `{ success: false, error }` on failure:

```typescript
const outcome = yield* askCatch(
  askQueueSendMessages('emails', { type: 'email.welcome', payload: { userId } }),
);

if (!outcome.success) {
  // outcome.error.errorType / outcome.error.errorText
}
```

## Notes

- Messages are sent with the caller's story session attached, which the pipeline restores when the consumer story runs.
- For FIFO ordering, set `groupId` per message to control which messages must stay ordered relative to each other.

## Related

- [defineQueue](../../../config/core/queue.md) — declares the queue this action sends to and maps message types to consumer stories.
- [askEventBusSendMessages](../event-bus/ask-event-bus-send-messages.md) — publish to an event bus (fan-out to many queues) instead of one queue.
- [askProcessEvent](../event/ask-process-event.md) — the pipeline that matches each delivered message to a consumer story and preserves FIFO group ordering.
