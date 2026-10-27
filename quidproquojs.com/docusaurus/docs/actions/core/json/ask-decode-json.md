---
title: askDecodeJson
description: Parse a JSON string safely from within a story, turning parse failures into catchable qpq errors.
---

# askDecodeJson

Parses a JSON string into a typed value, optionally validating the result with a predicate. On invalid JSON — or when the validator rejects the parsed value — it raises a **catchable qpq error** rather than letting a raw `SyntaxError` escape, so failures flow through the normal `askCatch` error-handling path.

- A composed story that wraps `JSON.parse` and, on failure, delegates to `askThrowError` with `ErrorTypeEnum.Invalid`.

```typescript
import { askDecodeJson } from '@qpqjs/core';

interface Settings {
  theme: string;
  maxItems: number;
}

export function* askLoadSettings(raw: string) {
  const settings = yield* askDecodeJson<Settings>(
    raw,
    (s) => typeof s.theme === 'string' && typeof s.maxItems === 'number',
  );
  return settings;
}
```

## Signature

```typescript
function* askDecodeJson<T>(
  json: string,
  validateObject?: (item: T) => boolean,
): AskResponse<T>;
```

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `json` | `string` | — | The JSON text to parse. |
| `validateObject` | `(item: T) => boolean` | none | Optional predicate run against the parsed value. Return `false` to reject it — the story then raises an `Invalid` error instead of returning. If omitted, any successfully-parsed JSON is returned as-is. |

The generic `T` is the expected shape of the decoded value; it is applied as a cast (`JSON.parse(json) as T`) and is not checked at runtime beyond your optional `validateObject` predicate.

## Returns

`T` — the parsed (and, if a predicate was supplied, validated) value.

## Errors

`askDecodeJson` does not define its own error enum; it throws the shared `ErrorTypeEnum.Invalid` error in two cases:

| Condition | Error |
| --- | --- |
| The input is not valid JSON (`JSON.parse` throws). | `ErrorTypeEnum.Invalid` — the error text includes the underlying parser message. |
| `validateObject` is supplied and returns `false`. | `ErrorTypeEnum.Invalid` — the error text notes the JSON parsed but failed structural validation. |
| `validateObject` is supplied and throws. | `ErrorTypeEnum.Invalid`: the error text notes the JSON parsed but the validation function threw, and includes the thrown message. |

Because these are thrown through the qpq error mechanism, catch them with `askCatch` from @qpqjs/core, which returns an `EitherActionResult` — `{ success: true, result }` on success, or `{ success: false, error }` on failure:

```typescript
const outcome = yield* askCatch(askDecodeJson<Settings>(raw));

if (outcome.success) {
  const settings = outcome.result;
} else {
  // outcome.error.errorType === ErrorTypeEnum.Invalid
  // outcome.error.errorText
}
```

## Related

- [askFileReadObjectJson](../file/ask-file-read-object-json.md) — read a file and JSON-decode it in one action.
- [askFileReadTextContents](../file/ask-file-read-text-contents.md) — read raw text you can then hand to `askDecodeJson`.
