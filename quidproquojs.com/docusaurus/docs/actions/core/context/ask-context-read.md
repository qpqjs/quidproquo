---
title: askContextRead
description: Read the current value of a story context by its identifier, falling back to the identifier's default.
---

# askContextRead

Reads the current value of a **context** for the running story. Context is ambient, story-scoped state — think of it as React context for stories: a value provided higher up the story tree with [askContextProvideValue](./ask-context-provide-value.md) is visible to every action beneath it, without being threaded through each function call.

If no provider up the tree has set a value for the identifier, the identifier's `defaultValue` is returned.

- **Action type:** `ContextActionType.Read`
- **Resolution:** read from the story session's context bag (or the separate local-context bag for a [local identifier](#local-context)); no external call.

```typescript
import { askContextRead, createContextIdentifier } from '@qpqjs/core';

// Declare an identifier once, export it, and share it between reader and provider.
export const CurrentTenantContext = createContextIdentifier<string>('current-tenant', 'public');

export function* askGetTenantScopedKey(key: string) {
  const tenant = yield* askContextRead(CurrentTenantContext);
  return `${tenant}/${key}`;
}
```

## Signature

```typescript
function* askContextRead<T>(
  contextIdentifier: QpqContextIdentifier<T>,
): AskResponse<T>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `contextIdentifier` | `QpqContextIdentifier<T>` | The identifier to read, created with [createContextIdentifier](#creating-an-identifier) (or `createLocalContextIdentifier`). Its type parameter `T` determines the return type. |

### `QpqContextIdentifier<T>`

```typescript
interface QpqContextIdentifier<T> {
  uniqueName: string;
  defaultValue: T;
  local?: boolean;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `uniqueName` | `string` | Globally unique name that ties a reader to the matching provider. |
| `defaultValue` | `T` | Returned by `askContextRead` when no provider has set a value. |
| `local` | `boolean?` | When `true`, the value lives in a separate bag that never crosses a service boundary — see [Local context](#local-context). |

## Creating an identifier

Use `createContextIdentifier<T>(uniqueName, defaultValue)` to make an identifier, and share the same instance between the code that provides the value and the code that reads it:

```typescript
import { createContextIdentifier } from '@qpqjs/core';

export const RequestIdContext = createContextIdentifier<string>('request-id', '');
```

## Reusable readers with `createContextReader`

If you read the same context in many places, `createContextReader(identifier)` returns a zero-argument generator bound to that identifier, so call sites don't repeat it:

```typescript
import { createContextReader, createContextIdentifier } from '@qpqjs/core';

const CurrentTenantContext = createContextIdentifier<string>('current-tenant', 'public');
export const askCurrentTenant = createContextReader(CurrentTenantContext);

export function* askDoWork() {
  const tenant = yield* askCurrentTenant();
  // ...
}
```

## Returns

`T` — the current context value, or the identifier's `defaultValue` if none was provided.

## Local context

A context created with `createLocalContextIdentifier<T>(uniqueName, defaultValue)` behaves exactly like a normal one within the service — it flows down the story tree and into in-process sub-runtimes — but its value is **never serialized across a service boundary** (queue, event bus, or cross-service call). Use it for values that are only meaningful in the current process, like an in-memory cache handle or a request-local flag.

> There is also an internal `Context/List` action that gathers the full context bag for propagation across service boundaries; it isn't part of the public story API — use `askContextRead` to read individual values.

## Related

- [askContextProvideValue](./ask-context-provide-value.md) — provides the value this action reads.
- [askEventDocStoreRead](../../features/event-doc/ask-event-doc-provide-store.md#askeventdocstoreread) — the event-doc store reader, built on this pattern.
