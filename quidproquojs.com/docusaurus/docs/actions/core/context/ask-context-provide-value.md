---
title: askContextProvideValue
description: Provide a context value for the duration of a wrapped sub-story, visible to every action inside it.
---

# askContextProvideValue

Runs a wrapped sub-story with a **context** value set, making that value visible to every [askContextRead](./ask-context-read.md) beneath it. This is the "provider" half of story context (the React-context analogy: `askContextProvideValue` is the `<Provider>`, `askContextRead` is `useContext`). The value applies only for the duration of the wrapped story; once it returns, the context reverts.

The wrapped story's return value is passed straight back out, so you can wrap any sub-story transparently.

- **Action type:** implemented on top of [askOverrideActions](../system/ask-override-actions.md) — it intercepts `Context/Read` (and the internal `Context/List`) for the matching identifier while the sub-story runs, and injects the value onto every relayed action so it survives into nested runtimes.

```typescript
import { askContextProvideValue, askContextRead, createContextIdentifier } from '@qpqjs/core';

export const CurrentTenantContext = createContextIdentifier<string>('current-tenant', 'public');

export function* askHandleRequest(tenant: string) {
  // Everything inside askProcessOrder can read CurrentTenantContext and see `tenant`.
  return yield* askContextProvideValue(CurrentTenantContext, tenant, askProcessOrder());
}

function* askProcessOrder() {
  const tenant = yield* askContextRead(CurrentTenantContext); // -> the provided tenant
  // ...
}
```

## Signature

```typescript
function* askContextProvideValue<R, T extends AskResponse<any>>(
  contextIdentifier: QpqContextIdentifier<R>,
  value: R,
  storyIterator: T,
): AskResponse<AskResponseReturnType<T>>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `contextIdentifier` | `QpqContextIdentifier<R>` | The identifier to provide a value for — see [askContextRead](./ask-context-read.md#qpqcontextidentifiert). The value's type `R` must match the identifier's type. |
| `value` | `R` | The value to expose to reads of this identifier inside `storyIterator`. |
| `storyIterator` | `AskResponse<...>` | The sub-story to run with the context in effect, e.g. `askProcessOrder()`. |

## Returns

The value returned by `storyIterator` — its type is inferred, so wrapping a story doesn't change what it returns.

## Reusable providers with `createContextProvider`

When you provide the same context in many places, `createContextProvider` builds a typed wrapper so you don't repeat the identifier at every call site. You give it the identifier and a mapper from your own arguments to the context value; it returns a generator you call with those arguments plus the sub-story:

```typescript
import { createContextProvider, createContextIdentifier } from '@qpqjs/core';

const CurrentUserContext = createContextIdentifier<{ id: string } | null>('current-user', null);

// Maps a userId argument into the stored context value.
export const askProvideCurrentUser = createContextProvider(CurrentUserContext, (userId: string) => ({ id: userId }));

export function* askHandle(userId: string) {
  return yield* askProvideCurrentUser(userId, askDoWork());
}
```

## Notes

- Nesting is supported: an inner provider for the same identifier shadows an outer one for the extent of its sub-story.
- For a value that must not cross service boundaries, create the identifier with `createLocalContextIdentifier` — see [Local context](./ask-context-read.md#local-context).

## Related

- [askContextRead](./ask-context-read.md) — reads the value provided here.
- [askOverrideActions](../system/ask-override-actions.md) — the lower-level action-interception primitive this is built on.
- [askEventDocProvideStore](../../features/event-doc/ask-event-doc-provide-store.md) — the event-doc store context, built on this pattern.
