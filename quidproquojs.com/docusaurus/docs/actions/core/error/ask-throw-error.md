---
title: askThrowError
description: Throw a structured, catchable QPQError from a story.
---

# askThrowError

Throws a structured error out of a story. Execution of the current story stops at the `yield*`, and the error propagates up until something catches it — either an enclosing [askCatch](../system/ask-catch.md) or the runtime itself (which turns it into the story's failed result).

- **Action type:** `ErrorActionType.ThrowError`

```typescript
import { askThrowError, ErrorTypeEnum } from '@qpqjs/core';

export function* askGetUser(userId: string) {
  const user = yield* askKvsGet('users', userId);

  if (!user) {
    yield* askThrowError(ErrorTypeEnum.NotFound, `No user with id ${userId}`);
  }

  return user;
}
```

## Signature

```typescript
function* askThrowError<T>(
  errorType: ErrorTypeEnum | string,
  errorText: string,
  errorStack?: string,
): AskResponse<T>;
```

The generic `T` is the type the call is typed to "return". Because the action always throws, the story never actually resumes past it — `T` exists only so `askThrowError` can stand in for a value in a type-checked expression (e.g. `return user ?? (yield* askThrowError(...))`).

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `errorType` | `ErrorTypeEnum \| string` | – | A category for the error. Prefer a member of [`ErrorTypeEnum`](#errortypeenum); a custom string is also allowed (e.g. a domain-specific error code). |
| `errorText` | `string` | – | A human-readable message. This text may be surfaced to the user, so keep it meaningful. |
| `errorStack` | `string` | – | Optional stack trace string. Usually omitted — leave it unset and the runtime supplies context. |

The three arguments together form a `QPQError`:

```typescript
export interface QPQError {
  errorType: ErrorTypeEnum | string;
  errorText: string;
  errorStack?: string;
}
```

### `ErrorTypeEnum`

The standard error categories. Their names deliberately echo HTTP-style semantics; the webserver maps them to status codes when an error reaches an API boundary.

| Member | Meaning |
| --- | --- |
| `Unauthorized` | The caller failed to provide valid credentials (typically not authenticated). |
| `PaymentRequired` | Payment is required to access this resource or perform this action. |
| `Forbidden` | The caller is authenticated but lacks sufficient privileges. |
| `NotFound` | The requested resource does not exist. |
| `TimeOut` | Timed out waiting for a downstream resource. |
| `UnsupportedMediaType` | The request used an unsupported media type or format. |
| `OutOfResources` | The system or a downstream resource is out of capacity. |
| `GenericError` | A generic failure that fits no more specific category (think "500 Internal Server Error"). |
| `NotImplemented` | The resource or action has not been implemented yet. |
| `NoContent` | The action succeeded but there is no content to return. |
| `BadRequest` | The request included invalid data or parameters. |
| `Invalid` | The request payload was invalid or in an unsupported format. |
| `Conflict` | The request conflicts with existing state (e.g. creating something that already exists). |

## Returns

Never returns normally — the action always throws. In types it resolves to `T` so it can be used in value position, but no value ever comes back.

## Interaction with `askCatch`

A thrown error does not have to crash the story. When the throwing story is wrapped in [askCatch](../system/ask-catch.md), the error is captured and returned as an `EitherActionResult` value instead of propagating:

```typescript
import { askCatch, askThrowError, ErrorTypeEnum } from '@qpqjs/core';

export function* askTryGetUser(userId: string) {
  const outcome = yield* askCatch(askGetUser(userId));

  if (outcome.success) {
    return outcome.result;
  }

  // outcome.error is the QPQError thrown above
  if (outcome.error.errorType === ErrorTypeEnum.NotFound) {
    return null;
  }

  // rethrow anything we don't want to handle
  return yield* askThrowError(outcome.error.errorType, outcome.error.errorText, outcome.error.errorStack);
}
```

The failure branch is `{ success: false, error }`, where `error` is exactly the `{ errorType, errorText, errorStack? }` you threw.

## Notes

- If nothing catches the error, the runtime records it as the story's `error` result. At an API boundary the webserver translates the `errorType` into an HTTP response.
- This is the idiomatic way to fail a story — throwing a plain JavaScript `Error` is caught by the runtime too, but it is always reported as `GenericError` with no chance to set a meaningful `errorType`.

## Related

- [askCatch](../system/ask-catch.md) — catch errors thrown here and handle them as values.
- [askRetry](../system/ask-retry.md) — retry a story whose actions throw, optionally filtered by `errorType`.
- [askValidateModelOrThrowError](../../features/validation/ask-validate-model-or-throw-error.md) — validates a model and throws `ErrorTypeEnum.Invalid` through this action.
