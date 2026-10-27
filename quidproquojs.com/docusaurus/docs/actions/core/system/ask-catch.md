---
title: askCatch
description: Run a story and capture any error as a value instead of throwing.
---

# askCatch

Runs a wrapped story and captures the outcome as an `EitherActionResult` object — `{ success: true, result }` when it completes, or `{ success: false, error }` when any action inside it fails. Instead of an error propagating and crashing the story, `askCatch` turns it into a value you branch on.

- **Built from:** a generator that re-yields each of the wrapped story's actions with `returnErrors: true`, so action failures come back as failure objects rather than throwing. It also catches thrown JavaScript errors and reports them as `GenericError`.

```typescript
import { askCatch } from '@qpqjs/core';

export function* askTryReadConfig() {
  const outcome = yield* askCatch(askFileReadTextContents('config', 'app.json'));

  if (outcome.success) {
    return outcome.result; // the file contents
  }

  // outcome.error is a QPQError: { errorType, errorText, errorStack? }
  return null;
}
```

Always destructure the **object** — `askCatch` never returns a tuple.

## Signature

```typescript
function* askCatch<T extends AskResponse<any>>(
  storyIterator: T,
  finallyIterator?: AskResponse<any>,
): AskResponse<EitherActionResult<AskResponseReturnType<T>>>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `storyIterator` | `AskResponse<...>` | The story to run and protect, e.g. `askFileReadTextContents('config', 'app.json')` or any generator that yields actions. Its return type flows through to `result` on success. |
| `finallyIterator` | `AskResponse<...>` | Optional cleanup story run in a `finally` — it executes whether the wrapped story succeeds, fails, or throws. Its own return value is discarded; use it for teardown (releasing a lock, closing a stream, etc.). |

## Returns

`EitherActionResult<T>`, where `T` is the wrapped story's return type. It is a discriminated union on `success`:

```typescript
// success
{ success: true; result: T }

// failure
{ success: false; error: QPQError }
```

`QPQError` is `{ errorType: ErrorTypeEnum | string; errorText: string; errorStack?: string }`. Narrow on `outcome.success` before reading `outcome.result` or `outcome.error` — TypeScript only exposes each field on its matching branch.

```typescript
const outcome = yield* askCatch(askGetUser(userId));

if (outcome.success) {
  const user = outcome.result;
  // ...
} else {
  if (outcome.error.errorType === ErrorTypeEnum.NotFound) {
    // handle the specific failure
  }
}
```

## Notes

- Errors surfaced here are exactly what [askThrowError](../error/ask-throw-error.md) throws — the `error` object is the `QPQError` you threw, with its `errorType` preserved.
- `askCatch` nests: an inner `askCatch` handles its own errors as values; anything it rethrows (or leaves uncaught) is seen by an outer `askCatch`.
- A thrown JavaScript `Error` (not an `askThrowError`) is also caught, but reported as `{ errorType: ErrorTypeEnum.GenericError, errorText: e.message }`.

## Related

- [askThrowError](../error/ask-throw-error.md) — throw the errors this captures.
- [askRetry](./ask-retry.md) — built on `askCatch`; retries a story and returns the same `EitherActionResult`.
- [askExecuteIf](./ask-execute-if.md) — conditionally run a story.
- [askWebsocketSendMessage](../../webserver/websocket/ask-websocket-send-message.md) — wrap it in `askCatch` to handle throttled/disconnected clients.
- [askValidateModelOrThrowError](../../features/validation/ask-validate-model-or-throw-error.md) — wrap it in `askCatch` to handle invalid input inline.
- [askEventDocGetByIdOrThrow](../../features/event-doc/ask-event-doc-get-by-id.md) — wrap it in `askCatch` to handle a missing event document without a throw.
