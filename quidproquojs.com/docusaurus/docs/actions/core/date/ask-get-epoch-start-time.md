---
title: askGetEpochStartTime
description: Get the Unix epoch start as an ISO-8601 timestamp string.
---

# askGetEpochStartTime

Returns the start of the Unix epoch — `1970-01-01T00:00:00.000Z` — as an ISO-8601 timestamp. Handy as a "zero" / earliest-possible date when seeding comparisons, default `since` cursors, or age calculations.

- A small composed story that returns the epoch constant as a `QpqIsoDateTime`. It performs no clock read, so it always resolves to the same value.

```typescript
import { askGetEpochStartTime, askSecondsElapsedFrom } from '@qpqjs/core';

export function* askAgeInSeconds(createdAt: string) {
  const epoch = yield* askGetEpochStartTime();
  // e.g. compare against the epoch as a lower bound
  return yield* askSecondsElapsedFrom(epoch, createdAt);
}
```

## Signature

```typescript
function* askGetEpochStartTime(): AskResponse<QpqIsoDateTime>;
```

## Parameters

None.

## Returns

`QpqIsoDateTime` — the fixed string `'1970-01-01T00:00:00.000Z'`. `QpqIsoDateTime` is a template-literal string type exported from @qpqjs/core, so it is a plain `string` at runtime with extra compile-time shape checking (see [askDateNow](./ask-date-now.md)).

## Related

- [askDateNow](./ask-date-now.md) — the current time as an ISO-8601 string.
- [askGetCurrentEpoch](./ask-get-current-epoch.md) / [askGetCurrentEpochMs](./ask-get-current-epoch-ms.md) — the current time as a number of seconds / milliseconds since this epoch.
- [askSecondsElapsedFrom](./ask-seconds-elapsed-from.md) — seconds between two ISO-8601 timestamps.
