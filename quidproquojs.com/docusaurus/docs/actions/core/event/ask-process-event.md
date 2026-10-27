---
title: askProcessEvent
description: The generic event-processing pipeline that turns a raw platform trigger into matched story executions and a response.
---

# askProcessEvent

`askProcessEvent` is the **event-processing pipeline** at the heart of every quidproquo service. When a platform trigger arrives — a queue message, an event-bus message, an HTTP request, a scheduled tick — the runtime hands the raw event to `askProcessEvent`, which figures out which story should handle it, runs that story, and shapes the response the platform expects.

You rarely call `askProcessEvent` yourself: the framework's entry points (in the action-processor packages) call it for you, and you write the individual stories it dispatches to. It's documented here so you understand what happens between "a message lands" and "your story runs" — and so you can build custom service types on the same pipeline.

- **Built from:** a sequence of per-service-type event actions — `askEventGetRecords`, `askEventMatchStory`, `askEventAutoRespond`, `askEventGetStorySession`, [askExecuteStory](../system/ask-execute-story.md), and `askEventTransformResponseResult` — each implemented by the action-processor for the platform the service runs on.

## The pipeline

For a given raw event, `askProcessEvent` runs:

1. **`askEventGetRecords(...eventArguments)`** — extract the list of individual records from the raw platform event. One SQS batch, one EventBridge event, or one HTTP request is normalized into an array of records.
2. For each record (in **parallel** via [askMapParallel](../../../actions/core/array/ask-map-parallel.md)):
   1. **`askEventMatchStory(record, eventArguments)`** — decide which story runtime should handle this record, returning a `MatchStoryResult` (`{ runtime, runtimeOptions, config }`). No match is an error for that record.
   2. **`askEventAutoRespond(record, matchResult)`** — an optional early exit. If it returns non-`null`, that value becomes the record's response and the story is **not** executed (used for auth failures, validation, CORS preflight, and similar short-circuits).
   3. **`askEventGetStorySession(eventArguments, record, matchResult)`** — build the [story session](../../../actions/core/config/ask-config-get-application-info.md) (caller identity, context) the matched story will run under.
   4. **[askExecuteStory](../system/ask-execute-story.md)`(runtime, [record, runtimeOptions], session)`** — run the matched story with the record as its argument. Each record's result is captured with [askCatch](../system/ask-catch.md), so one failing record doesn't abort the batch.
3. **`askEventTransformResponseResult(processedRecords, ...eventArguments)`** — fold the per-record results into the single response shape the platform expects (e.g. an HTTP response, or SQS batch-item-failure list). A failure here is logged at `Fatal` and rethrown.

## Signature

```typescript
function* askProcessEvent<
  EventParams extends unknown[] = any[],
  QpqEventRecord = any,
  QpqEventRecordResponse = any,
  MSR extends AnyMatchStoryResult = AnyMatchStoryResult,
  EventResponse = any,
>(...eventArguments: EventParams): AskResponse<EventResponse>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `...eventArguments` | `EventParams` | The raw event as delivered by the platform (e.g. the Lambda `event` and `context`). The shape is specific to the triggering service type; the matching action-processor's `askEventGetRecords` implementation knows how to read it. |

## Returns

`EventResponse` — the platform-shaped response produced by `askEventTransformResponseResult` (for example, an API Gateway HTTP response object).

## FIFO ordering — `askProcessEventWithGroupOrdering`

`askProcessEventWithGroupOrdering` is the ordered variant, used for FIFO queues and event buses where per-group order must be preserved.

```typescript
function* askProcessEventWithGroupOrdering<...>(
  getRecordGroupKey: (record: QpqEventRecord) => string | undefined,
  ...eventArguments: EventParams
): AskResponse<EventResponse>;
```

Instead of processing records in parallel, it walks them **one at a time**. When a record fails, its group key is remembered and every later record in that same group is failed **without executing** — so the platform can redeliver the group in order rather than letting a later message overtake a failed earlier one. Records in other groups are unaffected.

| Parameter | Type | Description |
| --- | --- | --- |
| `getRecordGroupKey` | `(record) => string \| undefined` | Returns the ordering group for a record (e.g. the FIFO message group id). Records with `undefined` are not group-ordered. |
| `...eventArguments` | `EventParams` | The raw event, as with `askProcessEvent`. |

## The pipeline actions

The individual `askEvent*` actions above are **extension points**, not story-author API — each service type implements them in its action-processor package (e.g. the HTTP API event processors in `@qpqjs/webserver`). You compose stories that get *matched and executed* by this pipeline; you don't yield these actions directly. Related transform hooks used by specific service types include `askEventTransformEventParams`, `askEventTransformEventRecord`, `askEventTransformEventRecordResponse`, and `askEventResolveCaughtError`.

## Related

- [askExecuteStory](../system/ask-execute-story.md) — runs the matched story for each record.
- [askCatch](../system/ask-catch.md) — isolates per-record failures so one bad record doesn't fail the batch.
- [askMapParallel](../../../actions/core/array/ask-map-parallel.md) — runs the per-record processing concurrently in the non-FIFO pipeline.
- [defineQueue](../../../config/core/queue.md) / [defineEventBus](../../../config/core/event-bus.md) — declare the FIFO sources this pipeline preserves ordering for.
- [askQueueSendMessages](../queue/ask-queue-send-messages.md) / [askEventBusSendMessages](../event-bus/ask-event-bus-send-messages.md) — enqueue/publish the messages this pipeline delivers to consumer stories.
- [defineRecurringSchedule](../../../config/core/recurring-schedule.md), [defineDeployEvent](../../../config/core/deploy-event.md), [defineNotifyError](../../../config/core/notify-error.md) — other event sources whose triggers flow through this pipeline.
