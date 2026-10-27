---
title: askDelay
description: Pause a story for a number of milliseconds.
---

# askDelay

Pauses the story for the given number of milliseconds before resuming.

- **Action type:** `PlatformActionType.Delay`
- **At runtime:** waits via `setTimeout` for `timeMs` milliseconds, then resolves with nothing.

Sleeping is a side effect tied to real wall-clock time, so a story never calls `setTimeout` itself. It `yield*`s this action and lets the runtime perform (and record) the wait, keeping the story a pure generator that can be inspected, tested, and replayed.

```typescript
import { askDelay } from '@qpqjs/core';

export function* askPollWithBackoff() {
  // Wait 500ms between attempts
  yield* askDelay(500);
}
```

## Signature

```typescript
function* askDelay(
  timeMs: number,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `timeMs` | `number` | How long to pause, in **milliseconds**. |

## Returns

`void` — the story resumes once the delay has elapsed.

## Notes

- The delay holds the running story open for its whole duration. In a metered runtime (e.g. an AWS Lambda invocation) that time still counts toward execution/billing, so prefer it for short waits — retry backoff, gentle rate-limiting — rather than long sleeps.

## Related

- [askDateNow](../date/ask-date-now.md) — read the current time, e.g. to decide how long to wait.
