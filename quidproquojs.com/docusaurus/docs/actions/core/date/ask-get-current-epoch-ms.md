---
title: askGetCurrentEpochMs
description: Read the current time as milliseconds since the Unix epoch.
---

# askGetCurrentEpochMs

Reads the current wall-clock time and returns it as the number of **milliseconds** elapsed since the Unix epoch (`1970-01-01T00:00:00.000Z`).

- Built from [askDateNow](./ask-date-now.md): it reads the runtime clock and converts the ISO-8601 timestamp to a millisecond count with `new Date(...).getTime()`.

```typescript
import { askGetCurrentEpochMs } from '@qpqjs/core';

export function* askStampMillis() {
  const nowMs = yield* askGetCurrentEpochMs();
  return { nowMs };
}
```

## Signature

```typescript
function* askGetCurrentEpochMs(): AskResponse<number>;
```

## Parameters

None.

## Returns

`number` — milliseconds since the Unix epoch, e.g. `1782518400000`. This matches JavaScript's native `Date.getTime()` / `Date.now()` unit.

## Notes

- Because the value comes from [askDateNow](./ask-date-now.md), the reading is resolved by the runtime and recorded in the execution log, keeping the story deterministic and replayable.
- For a whole-second count (the usual "Unix timestamp"), use [askGetCurrentEpoch](./ask-get-current-epoch.md) instead.

## Related

- [askGetCurrentEpoch](./ask-get-current-epoch.md) — the same reading truncated to whole seconds.
- [askDateNow](./ask-date-now.md) — the underlying clock read, as an ISO-8601 string.
- [askGetEpochStartTime](./ask-get-epoch-start-time.md) — the epoch itself as an ISO-8601 string.
- [askSecondsElapsedFrom](./ask-seconds-elapsed-from.md) — seconds between two timestamps.
