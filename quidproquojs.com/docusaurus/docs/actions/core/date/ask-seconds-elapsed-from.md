---
title: askSecondsElapsedFrom
description: Compute the number of seconds between two ISO-8601 timestamps.
---

# askSecondsElapsedFrom

Computes the number of seconds elapsed from a `startTime` to an `endTime`. If `endTime` is omitted, the current time is read from the runtime, so `askSecondsElapsedFrom(someTimestamp)` answers "how many seconds ago was this?".

- Built from [askDateNow](./ask-date-now.md): when `endTime` is not supplied it reads the runtime clock; otherwise it does no I/O and simply subtracts the two timestamps.

```typescript
import { askSecondsElapsedFrom } from '@qpqjs/core';

export function* askIsTokenExpired(issuedAt: string) {
  const age = yield* askSecondsElapsedFrom(issuedAt);
  return age > 3600; // older than one hour
}
```

## Signature

```typescript
function* askSecondsElapsedFrom(
  startTime: QpqIsoDateTime,
  endTime?: QpqIsoDateTime,
): AskResponse<number>;
```

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `startTime` | `QpqIsoDateTime` | — | The earlier ISO-8601 timestamp to measure from, e.g. a value produced by [askDateNow](./ask-date-now.md). |
| `endTime` | `QpqIsoDateTime` | current time | The later ISO-8601 timestamp to measure to. When omitted, the current time is read via [askDateNow](./ask-date-now.md). |

`QpqIsoDateTime` is a template-literal string type exported from @qpqjs/core (a plain `string` at runtime; see [askDateNow](./ask-date-now.md)).

## Returns

`number` — the difference `endTime − startTime` in seconds. The result is a floating-point value (sub-second differences are preserved, not floored) and is **negative** if `startTime` is later than `endTime`.

## Notes

- Only the two-argument form is deterministic on its own. When `endTime` is omitted the value depends on the runtime clock — resolved through [askDateNow](./ask-date-now.md) and recorded in the execution log, so the story still replays consistently.

## Related

- [askDateNow](./ask-date-now.md) — produces the ISO-8601 timestamps this compares.
- [askGetEpochStartTime](./ask-get-epoch-start-time.md) — the Unix epoch as an ISO-8601 string, useful as a lower bound.
- [askGetCurrentEpoch](./ask-get-current-epoch.md) / [askGetCurrentEpochMs](./ask-get-current-epoch-ms.md) — the current time as a numeric epoch.
- [Date/time math helpers](./date-time-math.md) — shift an ISO-8601 timestamp by days, months, or years.
