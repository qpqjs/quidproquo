---
title: askEventDocTransferExport
description: Export one or more docs and everything they reference as one staged bundle, and hand back a download link.
---

# askEventDocTransferExport

Exports one or more docs — and everything they reference — as **one** staged bundle, and returns a short-lived download link plus the manifest it covers (so a UI can show exactly what went in, including any soft-deleted docs that were reported but skipped). Selecting several docs at once produces one bundle: their manifests are merged and deduped, so a stylesheet three templates share travels once, not three times.

The manifest comes back in discovery order (the starting docs first); the bundle itself is written in **reverse**, which is leaves-first, so on import whatever a doc references always lands before the doc that points at it.

- **Built from:** [askEventDocManifest](./ask-event-doc-manifest.md) (the reference walk) then `askEventDocBundleBuild` (reads each doc's full log + assets into the bundle). Requires an `EventDocTransferRegistry` — read one with `askEventDocTransferReadRegistry`, or call from the built-in `POST /transfer/export` route where it's already resolved.

```typescript
import { askEventDocTransferExport, askEventDocTransferReadRegistry } from '@qpqjs/features';

export function* exportSelection(docs: EventDocDocRef[]) {
  const registry = yield* askEventDocTransferReadRegistry();

  const result = yield* askEventDocTransferExport(registry, docs);

  return result; // { downloadUrl, filename, items }
}
```

## Signature

```typescript
function* askEventDocTransferExport(
  registry: EventDocTransferRegistry,
  starts: EventDocDocRef[],
): AskResponse<EventDocTransferExportResult>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `registry` | `EventDocTransferRegistry` | `{ service, collections }` — which collections a transfer may read, as registered by [defineEventDocTransfer](../../../config/features/event-doc-transfer.md). |
| `starts` | `EventDocDocRef[]` | The docs the caller selected to export (`{ service, type, id }`). |

## Returns

`EventDocTransferExportResult`:

```typescript
type EventDocTransferExportResult = {
  downloadUrl: string; // short-lived, 15 minutes
  filename: string;
  items: EventDocManifestItem[]; // the full manifest, roots first
};
```

## Errors

| Condition | Error |
| --- | --- |
| `starts` is empty | `ErrorTypeEnum.BadRequest` ("Nothing selected to export.") |
| A root doc (not just one of its dependencies) is soft-deleted | `ErrorTypeEnum.BadRequest` ("Doc `{id}` is deleted and cannot be exported.") |

A dependency that is deleted at source is reported in the manifest and silently skipped from the bundle; a doc the operator explicitly picked being deleted is treated as a mistake worth stopping on instead.

## Related

- [askEventDocManifest](./ask-event-doc-manifest.md) — the reference walk this builds on.
- [askEventDocBundlePlan](./ask-event-doc-bundle-plan.md) / [askEventDocBundleApply](./ask-event-doc-bundle-apply.md) — the other end: review and apply a bundle produced by this story.
- [defineEventDocTransfer](../../../config/features/event-doc-transfer.md) — mounts `POST /transfer/export`, the HTTP entry point for this story.
