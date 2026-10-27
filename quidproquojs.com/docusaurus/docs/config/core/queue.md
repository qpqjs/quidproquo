---
title: defineQueue
description: Define a queue — a durable message queue whose consumer stories run for each message, driven by the message's type.
---

# defineQueue

Defines a **queue**: a durable, asynchronous message channel. Stories enqueue messages with [askQueueSendMessages](../../actions/core/queue/ask-queue-send-messages.md), and the runtime delivers each message to a consumer **story** chosen by the message's `type`. A queue can also subscribe to one or more [event buses](./event-bus.md) so bus messages are delivered to it.

- **On AWS:** deploys an **SQS queue** plus a dead-letter queue (`QpqCoreQueueConstruct`), and a consumer Lambda wired to the queue as an SQS event source (`QpqApiCoreQueueConstruct`, both in `@qpqjs/deploy-awscdk`). Failed messages are retried up to `maxTries` times before going to the DLQ. Default CloudWatch alarms cover a growing backlog and any message landing in the DLQ. When `isFifo` is `true`, FIFO SQS queues (`.fifo` suffix) are created and the consumer processes messages in group order.

```typescript
import { defineQueue } from '@qpqjs/core';

export default [
  defineQueue('emails', {
    'email.welcome': '/entry/queue/onSendWelcomeEmail::onSendWelcomeEmail',
  }),
];
```

## Signature

```typescript
function defineQueue(
  name: string,
  processors: QpqQueueProcessors,
  options?: QPQConfigAdvancedQueueSettings,
): QueueQPQConfigSetting;
```

## Parameters

### `name` — `string` (required)

The name of the queue. This is the name you pass to [askQueueSendMessages](../../actions/core/queue/ask-queue-send-messages.md) and it is the queue's `uniqueKey`. On AWS it derives the physical queue name (prefixed with application/module/environment).

### `processors` — `QpqQueueProcessors` (required)

A map from a message-**type pattern** to the consumer story that handles it:

```typescript
export interface QpqQueueProcessors {
  [type: string]: QpqFunctionRuntime;
}
```

Each key is matched against a delivered message's `type` field. The key may be a literal type (`'email.welcome'`) or a template with `{param}` placeholders (e.g. `'user.{userId}.created'`); the most relevant match wins, and any captured placeholder values are passed to the consumer story as its runtime options. Each value is a `QpqFunctionRuntime` — a reference to the consumer story's entry point, usually a relative path string of the form `'/path/to/file::exportedFunctionName'`. If a message's type matches no processor (and the queue has no event-bus subscriptions), that message errors.

### `options` — `QPQConfigAdvancedQueueSettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `batchSize` | `number` | `0` | Max number of messages delivered to the consumer Lambda per invocation. `0` leaves the SQS default. When set (> 0), the event source uses this batch size. |
| `batchWindowInSeconds` | `number` | `0` | Max time SQS waits to fill a batch before invoking the consumer — invoke as soon as a message arrives. Only applied when `batchSize > 0`, and **not** applied to FIFO queues (which don't support a batching window). A queue that wants to accumulate a batch before invoking should set this explicitly. |
| `concurrency` | `number` | `1` | Consumer concurrency hint. |
| `maxTries` | `number` | `1` | How many times a message is delivered before it is sent to the dead-letter queue (SQS `maxReceiveCount`). |
| `ttRetryInSeconds` | `number` | `900` | Retry/visibility timeout in seconds — how long a message stays invisible while being processed before it can be redelivered. Also used as the consumer Lambda timeout. Capped at 900 (15 minutes). |
| `hasDeadLetterQueue` | `boolean` | `true` | Whether a dead-letter queue backs the main queue. Note: the AWS deploy currently always provisions a DLQ; this flag is recorded in the config but not yet honoured by `QpqCoreQueueConstruct`. |
| `eventBusSubscriptions` | `string[]` | `[]` | Names of [event buses](./event-bus.md) this queue subscribes to. Each subscribed bus's messages are delivered into this queue. |
| `maxConcurrentExecutions` | `number` | – | Reserved concurrent executions for the consumer Lambda (caps parallelism). |
| `isFifo` | `boolean` | `false` | Creates a **FIFO** queue that preserves per-group ordering and supports deduplication. See [FIFO queues](#fifo-queues). |
| `deprecated` | `boolean` | `false` | Marks the queue as deprecated in the config. |

## FIFO queues

Setting `isFifo: true` deploys FIFO SQS queues (both the main queue and its DLQ). Ordering and deduplication are controlled per message when you enqueue, via the `groupId` and `deduplicationId` fields on each `QueueMessage` (see [askQueueSendMessages](../../actions/core/queue/ask-queue-send-messages.md)):

- Messages with the same `groupId` are processed in order. Unset, it defaults to the queue name (global ordering).
- `deduplicationId` suppresses duplicates within SQS's 5-minute window. Unset, a unique id is generated per send (no deduplication).

The FIFO consumer processes records one group at a time using [askProcessEventWithGroupOrdering](../../actions/core/event/ask-process-event.md): once a message in a group fails, later messages in that same group are held (not executed) so the group can be redelivered in order, while other groups continue. A FIFO queue may only subscribe to a FIFO event bus (validated at deploy). FIFO event sources also don't support a batching window.

## Examples

```typescript
import { defineQueue } from '@qpqjs/core';

export default [
  // Simple queue: one story per message type
  defineQueue('emails', {
    'email.welcome': '/entry/queue/onSendWelcomeEmail::onSendWelcomeEmail',
    'email.receipt': '/entry/queue/onSendReceipt::onSendReceipt',
  }),

  // Batched work queue with retries
  defineQueue('image-processing', {
    'image.uploaded': '/entry/queue/onImageUploaded::onImageUploaded',
  }, {
    batchSize: 10,
    batchWindowInSeconds: 30,
    maxTries: 3,
    ttRetryInSeconds: 300,
  }),

  // Ordered per-account processing, fed from an event bus
  defineQueue('account-projector', {
    'account.{accountId}.changed': '/entry/queue/onAccountChanged::onAccountChanged',
  }, {
    isFifo: true,
    eventBusSubscriptions: ['account-events'],
  }),
];
```

## Related

- [askQueueSendMessages](../../actions/core/queue/ask-queue-send-messages.md) — enqueues messages onto a queue declared here.
- [defineEventBus](./event-bus.md) — a bus a queue can subscribe to via `eventBusSubscriptions`.
- [askProcessEvent](../../actions/core/event/ask-process-event.md) — the pipeline that matches each delivered message to a consumer story (and preserves FIFO group ordering).
- [defineNotifyError](./notify-error.md) — subscribe a queue to its bus to handle error/throttle alarms as `NotifyErrorQueueEvent` messages.
- **AWS implementation:** `QpqCoreQueueConstruct` (SQS queue + DLQ + alarms) and `QpqApiCoreQueueConstruct` (consumer Lambda + SQS event source + bus subscriptions) in `@qpqjs/deploy-awscdk`; the send-message processor in `@qpqjs/actionprocessor-aws`.
