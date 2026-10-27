---
title: askEventDocRenderForCollection
description: Render a document from another collection in-process, addressed by identity alone.
---

# askEventDocRenderForCollection

Renders a document of **another** collection in-process — the in-lambda twin of the `GET {basePath}/{id}/render` route, for cross-collection composition (a template resolving its layout or content links as HTML). Provides the target collection's store context so the renderer's own reads (blob-drive assets, linked docs) resolve against the right stores, then invokes the `render` member of that collection's registered `EventDocFunctions` object with the caller-supplied `input`.

Unlike the render route, nothing here is soft: the caller names a specific collection expecting a renderer, so a missing registration or a functions object with no `render` member propagates as its dynamic-functions error rather than a 404.

- **Built from:** `askEventDocProvideStore` (to bind the target collection's store context) and `createDynamicFunctionCaller<EventDocInvokableFunctions>` (to invoke `render` on `eventDocFunctionsName(storeName, type)`, see [defineEventDoc](../../../config/features/event-doc.md)). The caller resolves WHICH state to render first — this only renders the input it's handed.

```typescript
import { askEventDocRenderForCollection } from '@qpqjs/features';

export function* renderTemplateLayout(state: unknown, docId: string) {
  const result = yield* askEventDocRenderForCollection('layouts', 'layout', { state, docId });

  return result.html;
}
```

## Signature

```typescript
function* askEventDocRenderForCollection(
  storeName: string,
  type: string,
  input: EventDocRenderInput,
): AskResponse<EventDocRenderResult>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `storeName` | `string` | The target collection's store name (not necessarily the caller's own). |
| `type` | `string` | The target collection's document type. |
| `input` | `EventDocRenderInput` | `{ state, docId, version?, renderMode?, effectiveAt? }` — the already-folded document state to render, exactly as the render route builds it. |

## Returns

`AskResponse<EventDocRenderResult>` — the rendered result (e.g. `{ kind: 'html', html }`).

## Notes

- Requires the target collection to have a `render` member on its registered `EventDocFunctions` object; a collection with none throws the dynamic-functions "not found" error rather than resolving to an empty result.
- The caller is responsible for resolving `renderMode`/`effectiveAt` into a concrete, already-folded `state` before calling this — it renders exactly what it's handed, the same contract the render route's controller follows.

## Related

- [defineEventDoc](../../../config/features/event-doc.md) — registers the `EventDocFunctions` object (`render`) this invokes.
- [askEventDocReferences](./ask-event-doc-references.md) — the sibling one-hop read (`collectReferences`) on the same registered object.
