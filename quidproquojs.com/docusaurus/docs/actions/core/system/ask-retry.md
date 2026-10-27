---
title: askRetry
description: Retry a story on failure with a wait between attempts and optional backoff.
---

# askRetry

Runs a story and retries it if it fails, waiting between attempts. It returns the same `EitherActionResult` shape as [askCatch](./ask-catch.md): the first successful outcome, or the last failure once retries are exhausted. Optionally restrict retries to specific error types and add linear backoff or jitter.

- **Built from:** [askCatch](./ask-catch.md) (to run each attempt and capture its outcome as a value), plus `askDelay` for the waits and `askNewGuid` for jitter entropy.

```typescript
import { askRetry, ErrorTypeEnum } from '@qpqjs/core';

export function* askChargeCard(paymentId: string) {
  const outcome = yield* askRetry(
    () => askCallPaymentProvider(paymentId),
    3,      // up to 3 retries after the first attempt
    1000,   // wait 1000ms between attempts
    [ErrorTypeEnum.TimeOut, ErrorTypeEnum.OutOfResources], // only retry these
  );

  if (outcome.success) {
    return outcome.result;
  }

  return yield* askThrowError(outcome.error.errorType, outcome.error.errorText);
}
```

## Signature

```typescript
function* askRetry<R>(
  askRunLogic: () => AskResponse<R>,
  maxRetries: number,
  timeToWaitMs: number,
  errorTypeRetryList?: string[],
  options?: AskRetryOptions,
): AskResponse<EitherActionResult<R>>;
```

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `askRunLogic` | `() => AskResponse<R>` | – | A **factory** that returns the story to attempt. It is called fresh for each attempt, so each retry starts a new run of the story. |
| `maxRetries` | `number` | – | The number of retries **after** the first attempt. The story runs at most `maxRetries + 1` times. |
| `timeToWaitMs` | `number` | – | Milliseconds to wait between attempts (the base wait; see `options.linearBackoff`). |
| `errorTypeRetryList` | `string[]` | – | If provided, only failures whose `errorType` is in this list are retried; any other error returns immediately. When omitted, every failure is retried. |
| `options` | `AskRetryOptions` | – | Optional backoff/jitter tuning — see below. |

### `AskRetryOptions`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `linearBackoff` | `boolean` | `false` | When `true`, the wait is multiplied by the (1-based) attempt number — `timeToWaitMs * attempt` — instead of a fixed interval. |
| `maxJitterMs` | `number` | – | Adds `0..maxJitterMs` of guid-derived jitter to each wait, so many callers losing the same race spread their retries out instead of retrying in lockstep. |

## Returns

`EitherActionResult<R>` — `{ success: true, result }` from the first attempt that succeeds, or `{ success: false, error }` holding the last failure once retries run out (or when a non-retryable error type is hit). This is the same object shape as [askCatch](./ask-catch.md), so branch on `outcome.success`.

## Notes

- Retries stop early when the error's `errorType` is not in `errorTypeRetryList` — the current failure is returned as-is.
- Jitter uses `askNewGuid` rather than `Math.random`, because stories must stay replay-safe (deterministic) and cannot call `Math.random` directly.

## Related

- [askCatch](./ask-catch.md) — the per-attempt error capture this is built on; same `EitherActionResult` return.
- [askThrowError](../error/ask-throw-error.md) — throw the failures that `askRetry` retries, and rethrow the final error.
