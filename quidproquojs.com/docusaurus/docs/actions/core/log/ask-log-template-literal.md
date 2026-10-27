---
title: askLogTemplateLiteral
description: Log an interpolated message written as a tagged template literal.
---

# askLogTemplateLiteral

Logs a message written as a [tagged template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates), keeping the literal string parts and the interpolated values separate so both the reconstructed message and the individual values are captured.

- **Action type:** `LogActionType.TemplateLiteral`
- **On AWS:** the string parts and values are recombined into the final message and written to stdout (`console.log`), flowing to CloudWatch Logs.

Because it is a tag function, you call it by placing the template literal directly after it — no parentheses:

```typescript
import { askLogTemplateLiteral } from '@qpqjs/core';

export function* askGreetUser(userId: string, age: number) {
  yield* askLogTemplateLiteral`User ${userId} is ${age} years old`;
}
```

## Signature

```typescript
function* askLogTemplateLiteral(
  strings: TemplateStringsArray,
  ...variables: DecomposedStringPrimitive[]
): AskResponse<void>;
```

## Parameters

These arguments are supplied automatically by the JavaScript tagged-template mechanism — you do not pass them by hand.

| Parameter | Type | Description |
| --- | --- | --- |
| `strings` | `TemplateStringsArray` | The literal (non-interpolated) string segments of the template. |
| `variables` | `DecomposedStringPrimitive[]` | The interpolated `${...}` values, in order. `DecomposedStringPrimitive` is `string \| number \| boolean \| symbol \| null \| undefined \| object`. |

Internally these are stored as a `DecomposedString` — a `[strings, variables]` tuple — so the message can be reconstructed while keeping each interpolated value addressable on its own.

## Returns

`void` — the story resumes once the entry has been logged.

## Notes

- `askLog` is exported from @qpqjs/core as an alias for `askLogTemplateLiteral`; the two are identical.
- Unlike [askLogCreate](./ask-log-create.md), this requester takes no log level.

## Related

- [askLogCreate](./ask-log-create.md) — log a message (with optional structured data) at an explicit log level.
- [askLogDisableEventHistory](./ask-log-disable-event-history.md) — control whether the story's full action history is persisted.
