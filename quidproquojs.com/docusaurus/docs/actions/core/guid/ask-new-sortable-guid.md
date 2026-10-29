---
title: askNewSortableGuid
description: Generate a new time-ordered, lexicographically sortable UUID.
---

# askNewSortableGuid

Generates a new globally-unique identifier that is **sortable** — ids minted later sort after ids minted earlier — and returns it as a string.

- **Action type:** `GuidActionType.NewSortable`
- **At runtime:** resolves to a UUID **version 7** (via the `uuidv7` library). UUIDv7 embeds a Unix millisecond timestamp in its leading bits, so the ids are time-ordered and sort chronologically as plain text.

Like [askGuidNew](./ask-new-guid.md), minting an id is non-deterministic, so it is done as an action: the runtime produces the id and records it in the execution log, keeping the story a pure generator that can be inspected, tested, and replayed with the same id.

**What "sortable" means:** because the timestamp is in the most-significant bits, a lexicographic (alphabetical / byte-order) sort of these ids matches their creation order. That makes them a good primary/sort key in a key-value store when you want "newest last" (or "newest first" reversed) without storing a separate timestamp column, while still being globally unique.

```typescript
import { askNewSortableGuid } from '@qpqjs/core';

export function* askAppendEvent(kind: string) {
  // Later events get larger ids, so a range scan returns them in order.
  const eventId = yield* askNewSortableGuid();
  return { eventId, kind };
}
```

## Signature

```typescript
function* askNewSortableGuid(): AskResponse<string>;
```

## Parameters

None.

## Returns

`string` — a UUID version 7, e.g. `018f9a3c-1c2e-7a4b-8e2d-2f1a6b5c9d0e`. Two ids generated at different times compare in creation order under an ordinary string sort.

## Notes

- Ids minted within the same millisecond stay unique (the remaining bits are random) and keep a stable relative order.
- Use this over [askGuidNew](./ask-new-guid.md) whenever the id doubles as a sort key; use plain [askGuidNew](./ask-new-guid.md) when you specifically do **not** want the creation time to be inferable from the id.

## Related

- [askGuidNew](./ask-new-guid.md) — a fully random (v4) id with no ordering.
- [askDateNow](../date/ask-date-now.md) — read the current timestamp directly instead of embedding it in an id.
