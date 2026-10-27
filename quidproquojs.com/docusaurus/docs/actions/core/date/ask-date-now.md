---
title: askDateNow
description: Read the current date and time from the runtime as an ISO-8601 timestamp.
---

# askDateNow

Reads the current wall-clock time from the runtime and returns it as an ISO-8601 timestamp string.

- **Action type:** `DateActionType.Now`
- **At runtime:** resolves to `new Date()` formatted as a UTC ISO-8601 string (e.g. `2026-06-26T00:00:00.000Z`).

Reading the clock is a source of non-determinism, so a story never calls `new Date()` directly. Instead it `yield*`s this action and lets the runtime supply the value. Because the runtime resolves the action, the resolved timestamp is recorded in the execution log — the story stays a pure generator that can be inspected, tested, and replayed with the exact same "now" it saw on the original run.

```typescript
import { askDateNow } from '@qpqjs/core';

export function* askStampRecord() {
  const createdAt = yield* askDateNow();
  return { createdAt };
}
```

## Signature

```typescript
function* askDateNow(): AskResponse<QpqIsoDateTime>;
```

## Parameters

None.

## Returns

`QpqIsoDateTime` — the current time as a UTC ISO-8601 string of the form `YYYY-MM-DDTHH:mm:ss.sssZ` (e.g. `2026-06-26T00:00:00.000Z`). `QpqIsoDateTime` is a template-literal string type exported from @qpqjs/core, so it is a plain `string` at runtime with extra compile-time shape checking.

## Notes

- The timestamp is always in UTC (trailing `Z`) with millisecond precision.
- Being a string, the value is safe to store in a key-value store, return from an API, or compare lexicographically (ISO-8601 sorts chronologically as text).

## Related

- [askGuidNewSortable](../guid/ask-new-sortable-guid.md) — for a time-ordered identifier, generated as a single sortable id rather than a timestamp.
- [askGetCurrentEpoch](./ask-get-current-epoch.md) / [askGetCurrentEpochMs](./ask-get-current-epoch-ms.md) — the current time as seconds / milliseconds since the Unix epoch.
- [askGetEpochStartTime](./ask-get-epoch-start-time.md) — the Unix epoch as an ISO-8601 string.
- [askSecondsElapsedFrom](./ask-seconds-elapsed-from.md) — seconds between two ISO-8601 timestamps.
- [Date/time math helpers](./date-time-math.md) — shift an ISO-8601 timestamp by days, months, or years.
- [askEventDocCreate](../../features/event-doc/ask-event-doc-create.md) / [askEventDocSoftDelete](../../features/event-doc/ask-event-doc-soft-delete.md) — stamp event-document timestamps with this.
