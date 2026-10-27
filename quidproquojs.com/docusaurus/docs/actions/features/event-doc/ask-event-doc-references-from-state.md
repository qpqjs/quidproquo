---
title: askEventDocReferencesFromState
description: The other docs the CURRENT document depends on, one hop out, folded snapshot-seeded rather than walking the log.
---

# askEventDocReferencesFromState

Reads the `EventDocLink`s the **current** document state depends on, one hop out. Folds the document snapshot-seeded (via [askEventDocDocumentStateLatest](./ask-event-doc-get-by-id.md)) and hands the folded state to the `collectReferencesFromState` member of the collection's registered `EventDocFunctions` object (looked up as `eventDocFunctionsName(storeName, type)`, see [defineEventDoc](../../../config/features/event-doc.md)). No log walk — this is the references ROUTE's read: what the document references now, at the cost of the gap since the nearest snapshot rather than the whole log.

A collection with no registered functions object is a leaf: this returns `[]`. So does a document with no events.

- **Built from:** [askEventDocResolveStore](./ask-event-doc-provide-store.md#askeventdocresolvestore) (to read the collection's `storeName`/`type`, which address its functions registration) and `askEventDocDocumentStateLatest` (the folded state `collectReferencesFromState` walks). Requires the store context — call it inside `askEventDocProvideStore({ storeName, type }, ...)`, or from a built-in route where the context is already provided.

```typescript
import { askEventDocReferencesFromState } from '@qpqjs/features';

export function* readTemplateDependencies(templateId: string) {
  const links = yield* askEventDocReferencesFromState(templateId);

  return links; // EventDocLink[] — e.g. the template's layout, styles, and content
}
```

## Signature

```typescript
function* askEventDocReferencesFromState(docId: string): AskResponse<EventDocLink[]>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `docId` | `string` | The document to read outbound references for. |

## Returns

`EventDocLink[]` — the doc's outbound links, one hop out, as of the current state. Empty when the collection has no registered `EventDocFunctions` object, that object's `collectReferencesFromState` returns none, or the document has no events.

## Notes

- This is a **one-hop, current-state** read — the full-history equivalent (every link ANY historical state ever held) is [askEventDocReferences](./ask-event-doc-references.md), used by the transfer export instead.
- `GET {basePath}/{id}/references`, mounted by [defineEventDocRoutes](../../../config/features/event-doc-routes.md), calls this for one document; the route is always mounted, resolving to `[]` when no functions object is registered.

## Related

- [defineEventDoc](../../../config/features/event-doc.md) — registers the `EventDocFunctions` object (`collectReferencesFromState`) this reads.
- [askEventDocReferences](./ask-event-doc-references.md) — the full-history sibling read, used by the transfer export.
- [askEventDocRenderForCollection](./ask-event-doc-render-for-collection.md) — the sibling read (`render`) on the same registered object.
- [askEventDocGetByIdOrThrow](./ask-event-doc-get-by-id.md) — read the document's own summary alongside its references.
