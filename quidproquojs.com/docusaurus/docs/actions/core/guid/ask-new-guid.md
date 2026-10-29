---
title: askGuidNew
description: Generate a new random (version 4) UUID.
---

# askGuidNew

Generates a new random, globally-unique identifier and returns it as a string.

- **Action type:** `GuidActionType.New`
- **At runtime:** resolves to a random (version 4) UUID via the platform's `crypto.randomUUID()`.

Minting an id is non-deterministic — two runs would otherwise produce different values. By yielding this as an action, the story stays a pure generator: the runtime produces the id and records it in the execution log, so the run can be inspected, tested, and replayed with the exact same id it saw originally.

```typescript
import { askGuidNew } from '@qpqjs/core';

export function* askCreateUser(name: string) {
  const userId = yield* askGuidNew();
  return { userId, name };
}
```

## Signature

```typescript
function* askGuidNew(): AskResponse<string>;
```

## Parameters

None.

## Returns

`string` — a random version 4 UUID, e.g. `109156be-c4fb-41ea-b1b4-efe1671c5836`.

## Notes

- The id is fully random. It carries no ordering information, so rows keyed by it are not naturally sorted by creation time — use [askNewSortableGuid](./ask-new-sortable-guid.md) when you want that.

## Related

- [askNewSortableGuid](./ask-new-sortable-guid.md) — a time-ordered, lexicographically sortable id.
- [askEventDocCreate](../../features/event-doc/ask-event-doc-create.md) — uses this to mint a new event document's id.
