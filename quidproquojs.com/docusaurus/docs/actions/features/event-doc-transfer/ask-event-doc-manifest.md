---
title: askEventDocManifest
description: Walk one or more docs' references outward to find everything that has to travel with them.
---

# askEventDocManifest

Finds every doc that has to travel with a list of starting docs, by following each doc's `collectReferences` links outward — breadth-first, across collections, with a visited set so a stylesheet three templates share is walked once and lands in the result once. Also the source of a cycle's termination: a link cycle (template → content → template) stops on the visited check instead of recursing forever.

Takes a **list** of roots so selecting several documents produces one merged manifest, rather than one per selection. A soft-deleted doc is reported (`deleted: true`) but not walked into — it will never be bundled, so its own dependencies are moot.

- **Built from:** [askEventDocReferences](../event-doc/ask-event-doc-references.md) (per doc, to find its outbound links) and [askEventDocTransferProvideCollection](#askeventdoctransferprovidecollection) (to run each visit against the right collection's store). Requires an `EventDocTransferRegistry` — read one with `askEventDocTransferReadRegistry`, or call from a built-in transfer route where it's already resolved.

```typescript
import { askEventDocManifest, askEventDocTransferReadRegistry } from '@qpqjs/features';

export function* previewExport(docs: EventDocDocRef[]) {
  const registry = yield* askEventDocTransferReadRegistry();

  const items = yield* askEventDocManifest(registry, docs);

  return items; // EventDocManifestItem[] — every doc that would travel, roots first
}
```

## Signature

```typescript
function* askEventDocManifest(
  registry: EventDocTransferRegistry,
  starts: EventDocDocRef[],
): AskResponse<EventDocManifestItem[]>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `registry` | `EventDocTransferRegistry` | `{ service, collections }` — which collections a transfer may read, as registered by [defineEventDocTransfer](../../../config/features/event-doc-transfer.md). |
| `starts` | `EventDocDocRef[]` | The selected root docs (`{ service, type, id }`), depth `0` in the result. |

## Returns

`EventDocManifestItem[]` — every doc discovered, in discovery order (roots first, then whatever they reference, breadth-first):

```typescript
type EventDocManifestItem = EventDocDocRef & {
  code: string;
  name: string;
  depth: number; // 0 for a start doc, shortest link distance otherwise
  deleted: boolean; // reported but never bundled
};
```

## Notes

- An unregistered or cross-service reference throws `ErrorTypeEnum.BadRequest` rather than being silently skipped — an incomplete manifest can never masquerade as a complete export.
- Reversing the result is leaves-first, the order [askEventDocTransferExport](./ask-event-doc-transfer-export.md) writes a bundle in and an import applies it in.

## Related

- [askEventDocTransferExport](./ask-event-doc-transfer-export.md) — builds and stages a bundle from the same manifest walk.
- [defineEventDocTransfer](../../../config/features/event-doc-transfer.md) — mounts `POST /transfer/manifest`, the HTTP entry point for this story.
- [askEventDocReferences](../event-doc/ask-event-doc-references.md) — the per-doc reference read this walks.
