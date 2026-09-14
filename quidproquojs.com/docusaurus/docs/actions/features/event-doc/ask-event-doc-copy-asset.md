---
title: askEventDocCopyAsset
description: Copy an asset from another collection's document onto one of this collection's documents as a new immutable asset.
---

# askEventDocCopyAsset

Copies an asset from a document in another collection (`sourceStoreName`) onto `targetDocId` in **this** collection (the provided store context) as a new immutable asset, and returns its ref. The bytes never cross the story — it's a server-side copy — and the stored mimetype comes with them. Both sides resolve under the ambient storage scope, so a copy never crosses a tenant partition.

- **Requires the store context** — provide it via [askEventDocProvideStore](./ask-event-doc-provide-store.md) / [askEventDocProvideStoreFromGlobals](./ask-event-doc-provide-store.md#askeventdocprovidestorefromglobals). The target drive is resolved from that context; the source drive is derived from `sourceStoreName`.
- **Built from:** [askFileCopy](../../core/file/ask-file-copy.md) plus [askNewGuid](../../core/guid/ask-new-guid.md) — not a single action.
- Also reachable as `EventDocBackend.askCopyAssetFrom` on a backend created by `createEventDocBackend`, which runs it under that backend's own store.

```typescript
import { askEventDocCopyAsset } from 'quidproquo-features';

export function* duplicateCoverImage(sourceDocId: string, cover: EventDocAssetRef, targetDocId: string) {
  const ref = yield* askEventDocCopyAsset('renderGroups', sourceDocId, cover, targetDocId, 'cover.png');
  // record ref.guid in a domain event, e.g. via askEventDocAppendServerEvent
  return ref;
}
```

## Signature

```typescript
function* askEventDocCopyAsset(
  sourceStoreName: string,
  sourceDocId: string,
  sourceAsset: EventDocAssetRef,
  targetDocId: string,
  targetFilename?: string,
): AskResponse<EventDocAssetRef>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `sourceStoreName` | `string` | The store name of the collection the asset is being copied from — used to derive its storage drive. |
| `sourceDocId` | `string` | The document owning the source asset in that collection. |
| `sourceAsset` | `EventDocAssetRef` | Reference to the asset to copy — `{ guid, filename, mimetype }`. |
| `targetDocId` | `string` | The document in this collection the copy is attached to — determines the new blob's `<docId>/assets/<guid>` key. |
| `targetFilename` | `string` | Optional filename for the copy's ref. Defaults to `sourceAsset.filename` when omitted. |

## Returns

`AskResponse<EventDocAssetRef>` — `{ guid, filename, mimetype }`, a first-class reference to record in a domain event on the target document. `guid` is freshly minted; `mimetype` is carried over from `sourceAsset`.

## Notes

- Resolves the target drive from the store context, so a missing context throws (see [askEventDocResolveStore](./ask-event-doc-provide-store.md#askeventdocresolvestore)).
- The copy is immutable like any other asset: a fresh guid, independent of the source going forward.

## Related

- [askFileCopy](../../core/file/ask-file-copy.md) — the core action this is built on.
- [askEventDocWriteAsset](./ask-event-doc-generate-asset-upload-url.md#askeventdocwriteasset) — write a server-held asset directly instead of copying one.
- [askEventDocGenerateAssetUploadUrl](./ask-event-doc-generate-asset-upload-url.md) — the presigned-upload counterpart for client-supplied bytes.
- [askEventDocProvideStore](./ask-event-doc-provide-store.md) — provides the store context this requires.
