---
title: askExecuteIf
description: Run a story only when a condition is true, otherwise return undefined.
---

# askExecuteIf

Conditionally runs a story. When the condition is `true`, the wrapped story runs and its return value is passed straight back; when it is `false`, the story is skipped entirely and `askExecuteIf` returns `undefined`. It lets you keep a conditional branch inside a single expression instead of an `if` around a `yield*`.

- **Built from:** a thin generator wrapper — it either `yield*`s the wrapped story or returns `undefined`.

```typescript
import { askExecuteIf } from '@qpqjs/core';

export function* askMaybeNotify(user: User, shouldNotify: boolean) {
  // askSendWelcomeEmail only runs when shouldNotify is true.
  const result = yield* askExecuteIf(askSendWelcomeEmail(user), shouldNotify);

  return result; // the email result, or undefined if skipped
}
```

## Signature

```typescript
function* askExecuteIf<T extends AskResponse<any>>(
  storyIterator: T | boolean,
  condition?: boolean,
): AskResponse<AskResponseReturnType<T> | undefined>;
```

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `storyIterator` | `AskResponse<...> \| boolean` | – | The story to run when the condition holds, e.g. `askSendWelcomeEmail(user)`. |
| `condition` | `boolean` | `true` | Whether to run the story. When `false` (or when `storyIterator` isn't a runnable story object), the story is skipped and `undefined` is returned. |

## Returns

The wrapped story's return value when it runs, otherwise `undefined`. The return type is `AskResponseReturnType<T> | undefined`, so callers must account for the skipped case.

## Notes

- `condition` defaults to `true`, so `askExecuteIf(story)` with no second argument always runs the story.
- The story is only stepped when it actually runs — a skipped story yields none of its actions, so nothing inside it executes.

## Related

- [askCatch](./ask-catch.md) — run a story and capture its errors as a value.
- [askRunParallel](./ask-run-parallel.md) — run several stories concurrently.
