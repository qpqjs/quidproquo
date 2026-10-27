---
title: askGetCurrentEpoch
description: Read the current time as whole seconds since the Unix epoch.
---

# askGetCurrentEpoch

Reads the current wall-clock time and returns it as the number of whole **seconds** elapsed since the Unix epoch (`1970-01-01T00:00:00.000Z`) — the conventional "Unix timestamp".

- Built from [askGetCurrentEpochMs](./ask-get-current-epoch-ms.md): it takes the millisecond epoch and floors it to whole seconds (`Math.floor(ms / 1000)`).

```typescript
import { askGetCurrentEpoch } from '@qpqjs/core';

export function* askBuildJwtClaims() {
  const iat = yield* askGetCurrentEpoch();
  return { iat, exp: iat + 3600 };
}
```

## Signature

```typescript
function* askGetCurrentEpoch(): AskResponse<number>;
```

## Parameters

None.

## Returns

`number` — whole seconds since the Unix epoch, e.g. `1782518400`. Any sub-second remainder is discarded (floored toward zero), so this is always an integer. Useful anywhere a second-precision Unix timestamp is expected, such as JWT `iat`/`exp` claims.

## Notes

- The underlying reading comes from [askDateNow](./ask-date-now.md) via [askGetCurrentEpochMs](./ask-get-current-epoch-ms.md), so the value is resolved by the runtime and recorded in the execution log — the story stays deterministic and replayable.
- For millisecond precision, use [askGetCurrentEpochMs](./ask-get-current-epoch-ms.md).

## Related

- [askGetCurrentEpochMs](./ask-get-current-epoch-ms.md) — the same reading with millisecond precision.
- [askDateNow](./ask-date-now.md) — the underlying clock read, as an ISO-8601 string.
- [askGetEpochStartTime](./ask-get-epoch-start-time.md) — the epoch itself as an ISO-8601 string.
- [askSecondsElapsedFrom](./ask-seconds-elapsed-from.md) — seconds between two timestamps.
