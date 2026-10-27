---
title: askInlineFunctionExecute
description: Invoke a registered inline function by name and return its result, running it in-process as a nested story.
---

# askInlineFunctionExecute

Invokes an [inline function](../../../config/core/inline-function.md) by name, passing it a payload, and returns whatever the function's story returns. Unlike a queue or event-bus message, this is **synchronous** — the caller waits for the result. The referenced story runs in-process as a nested story (one depth deeper), sharing the caller's action processors and session context.

- **Action type:** `InlineFunctionActionType.Execute`

```typescript
import { askInlineFunctionExecute } from '@qpqjs/core';

export function* quoteOrder(order: { subtotal: number; region: string }) {
  const tax = yield* askInlineFunctionExecute<number, { amount: number; region: string }>(
    'calculateTax',
    { amount: order.subtotal, region: order.region },
  );

  return order.subtotal + tax;
}
```

## Signature

```typescript
function* askInlineFunctionExecute<R, T>(
  functionName: string,
  payload: T,
): AskResponse<R>;
```

The two generics are the **return type** `R` (what the invoked story resolves to) and the **payload type** `T` (what you pass in). They are independent — set `R` to the invoked function's return type.

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `functionName` | `string` | Name of the inline function to run — must match the `functionName` of a function registered with [defineInlineFunction](../../../config/core/inline-function.md). |
| `payload` | `T` | The single argument passed to the invoked story. |

## Returns

`R` — the value the invoked story returns. The result is returned directly to the caller (there is no wrapper object).

## Notes

- The invoked story runs **in the same process** as the caller (nested one level deeper), not as a separate deployed service — inline functions add no infrastructure of their own.
- If no inline function matches `functionName`, the action fails with `ErrorTypeEnum.NotFound`. If the invoked story itself throws, that error is propagated to the caller (with the function name added to the error stack). `askInlineFunctionExecute` does not define its own error enum; catch failures with `askCatch`:

```typescript
const outcome = yield* askCatch(
  askInlineFunctionExecute('calculateTax', { amount, region }),
);

if (outcome.success) {
  const tax = outcome.result;
} else {
  // outcome.error.errorType / outcome.error.errorText
}
```

## Related

- [defineInlineFunction](../../../config/core/inline-function.md) — registers the story this action can invoke by name.
