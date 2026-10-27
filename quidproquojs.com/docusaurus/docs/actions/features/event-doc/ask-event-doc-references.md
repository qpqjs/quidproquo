---
title: askEventDocReferences
description: Every doc one document has ever depended on, across its whole history, via its collection's registered EventDocFunctions object.
---

# askEventDocReferences

Reads the `EventDocLink`s a document has **ever** depended on, one hop out, across its whole history. Hands the document's whole event log to the `collectReferences` member of the collection's registered `EventDocFunctions` object (looked up as `eventDocFunctionsName(storeName, type)`, see [defineEventDoc](../../../config/features/event-doc.md)) and lets it fold + walk it, so a link that existed only in an older version is still found. A collection with no registered functions object is a leaf: this returns `[]`.

This is the **transfer export's** read — it exports the whole history and must chase links from all of it. `GET {basePath}/{id}/references` uses [askEventDocReferencesFromState](./ask-event-doc-references-from-state.md) instead (the CURRENT document only, folded snapshot-seeded rather than walking the log).

- **Built from:** [askEventDocResolveStore](./ask-event-doc-provide-store.md#askeventdocresolvestore) (to read the collection's `storeName`/`type`, which address its functions registration) and `askEventDocEventListAll` (the full log `collectReferences` folds). Requires the store context — call it inside `askEventDocProvideStore({ storeName, type }, ...)`, or from a built-in route where the context is already provided.

```typescript
import { askEventDocReferences } from '@qpqjs/features';

export function* readTemplateDependencies(templateId: string) {
  const links = yield* askEventDocReferences(templateId);

  return links; // EventDocLink[] — e.g. the template's layout, styles, and content
}
```

## Signature

```typescript
function* askEventDocReferences(docId: string): AskResponse<EventDocLink[]>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `docId` | `string` | The document to read outbound references for. |

## Returns

`EventDocLink[]` — the doc's outbound links, one hop out. Empty when the collection has no registered `EventDocFunctions` object, or that object's `collectReferences` returns none.

## Notes

- This is a **one-hop** read, over the **whole log**. The recursive walk over these edges (following a template into its content, then that content's own references, and so on) is the transfer feature's job — see [askEventDocManifest](../event-doc-transfer/ask-event-doc-manifest.md).
- `GET {basePath}/{id}/references`, mounted by [defineEventDocRoutes](../../../config/features/event-doc-routes.md), calls [askEventDocReferencesFromState](./ask-event-doc-references-from-state.md) instead of this — the route only ever needs the CURRENT document's references.

## Related

- [defineEventDoc](../../../config/features/event-doc.md) — registers the `EventDocFunctions` object (`collectReferences`) this reads.
- [askEventDocReferencesFromState](./ask-event-doc-references-from-state.md) — the sibling, current-state-only read backing the references route.
- [askEventDocRenderForCollection](./ask-event-doc-render-for-collection.md) — the sibling read (`render`) on the same registered object.
- [askEventDocManifest](../event-doc-transfer/ask-event-doc-manifest.md) — the recursive walk built on top of this, one collection at a time.
- [askEventDocGetByIdOrThrow](./ask-event-doc-get-by-id.md) — read the document's own summary alongside its references.
