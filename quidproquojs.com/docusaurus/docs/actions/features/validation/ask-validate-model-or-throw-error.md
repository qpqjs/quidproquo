---
title: askValidateModelOrThrowError
description: Validate a model against a Zod schema and throw a catchable qpq error if it doesn't match.
---

# askValidateModelOrThrowError

Validates a model against a [Zod](https://zod.dev) schema. If the model matches, the story continues and the (typed) model is returned. If it doesn't, the story throws a catchable qpq error carrying a human-readable description of what was wrong — so you can validate request payloads at the top of a route handler and let the runtime turn a failure into an error response.

- **Built from:** a `schema.safeParse` check followed by [askThrowError](../../core/error/ask-throw-error.md) with `ErrorTypeEnum.Invalid` when parsing fails. It is a composed story, not a single action.

```typescript
import { askValidateModelOrThrowError } from '@qpqjs/features';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0),
});

export function* createUser(unvalidated: unknown) {
  // Throws ErrorTypeEnum.Invalid if the body doesn't match the schema.
  const body = yield* askValidateModelOrThrowError(unvalidated as any, CreateUserSchema);

  // body is typed as z.infer<typeof CreateUserSchema> from here on.
  // ...persist the user
}
```

## Signature

```typescript
function* askValidateModelOrThrowError<T extends z.AnyZodObject>(
  model: z.infer<T>,
  schema: T,
): AskResponse<z.infer<T>>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `model` | `z.infer<T>` | The value to validate. Typed as the schema's inferred type — pass the candidate payload (cast it if it arrives as `unknown`). |
| `schema` | `T` (a `z.AnyZodObject`) | The Zod object schema to validate against. Its `.safeParse` decides success or failure. |

## Returns

`z.infer<T>` — on success the story resumes and returns the original `model`, now carrying the schema's inferred type. On failure the story does not return; it throws (see [Errors](#errors)).

## Errors

This story throws a core qpq error via [askThrowError](../../core/error/ask-throw-error.md) rather than defining its own error enum:

| Error | Meaning |
| --- | --- |
| `ErrorTypeEnum.Invalid` | The model failed schema validation. The error text is the message produced by `zod-validation-error`'s `fromZodError` — a readable summary of the failing field(s) — and the error stack is the Zod error's stack. |

Because it is a normal thrown qpq error, wrap the call in [askCatch](../../core/system/ask-catch.md) if you want to handle validation failure inline instead of letting it propagate:

```typescript
const outcome = yield* askCatch(askValidateModelOrThrowError(body as any, CreateUserSchema));
if (outcome.success) {
  // outcome.result is the validated model
} else {
  // outcome.error.errorType === ErrorTypeEnum.Invalid
  // outcome.error.errorText holds the readable validation message
}
```

## Related

- [askThrowError](../../core/error/ask-throw-error.md) — the action this story throws with on failure.
- [askCatch](../../core/system/ask-catch.md) — catch the thrown error to handle invalid input inline.
