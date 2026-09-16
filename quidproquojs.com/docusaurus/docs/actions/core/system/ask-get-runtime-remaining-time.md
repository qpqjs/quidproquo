---
title: askGetRuntimeRemainingTime
description: How many milliseconds the current execution has left before the platform kills it.
---

# askGetRuntimeRemainingTime

Returns the number of **milliseconds** left before the platform terminates the current execution. Use it inside long-running loops (an agentic AI turn, a large batch sweep) to stop cleanly and hand off before the hard cutoff.

- **Action type:** `SystemActionType.GetRuntimeRemainingTime`

```typescript
import { askGetRuntimeRemainingTime } from 'quidproquo-core';

const HANDOFF_HEADROOM_MS = 60_000;

export function* askProcessUntilDeadline(items: string[]) {
  for (const item of items) {
    if ((yield* askGetRuntimeRemainingTime()) < HANDOFF_HEADROOM_MS) {
      return { done: false, resumeFrom: item };
    }

    yield* askProcessItem(item);
  }

  return { done: true };
}
```

## Signature

```typescript
function* askGetRuntimeRemainingTime(): AskResponse<number>;
```

## Parameters

None.

## Returns

`number` — milliseconds remaining. It counts down across the execution, so reading it later in the same story returns a smaller value.

## Notes

- On AWS Lambda this is the invocation's `getRemainingTimeInMillis()`, so it reflects the function's configured timeout (queue processors run for up to 15 minutes).
- Runtimes with no execution limit (plain Node, the browser, the dev server) return `Number.MAX_SAFE_INTEGER`. Code that reads it should treat any large value as "no deadline" rather than comparing against a fixed budget.
- Leave headroom. The check only runs where you put it, so keep enough time for the current step to finish plus whatever save or re-enqueue the handoff needs.

## Related

- [askGetRuntimeCorrelation](./ask-get-runtime-correlation.md) — the other per-execution runtime value.
