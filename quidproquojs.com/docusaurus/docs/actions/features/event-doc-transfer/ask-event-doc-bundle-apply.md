---
title: askEventDocBundleApply
description: Import every doc in a staged bundle, in leaves-first order, and report what happened per doc.
---

# askEventDocBundleApply

Imports every doc in a staged bundle, in bundle order (leaves-first, the order [askEventDocTransferExport](./ask-event-doc-transfer-export.md) wrote it in), and reports what happened per doc in the same row shape [askEventDocBundlePlan](./ask-event-doc-bundle-plan.md) returns.

Docs are imported independently: a blocking row (`diverged`, `codeConflict`) is reported and the rest of the bundle still lands. That is deliberate — the alternative, aborting the whole bundle, would mean one hand-edited doc in the target blocks every unrelated doc's promotion. Every write is conditional (on `(docId, index)`, or on an absent asset guid), so re-running after fixing the blocker is safe.

- **Built from:** `askEventDocTransferProvideCollection` (runs each doc's import against its own collection's store) then `askEventDocBundleApplyDoc` (the per-doc write). Requires an `EventDocTransferRegistry` and a parsed `EventDocBundle` — the built-in `POST /transfer/import` route resolves both from `{ transferId }`, plus the importing user id, before calling this.

```typescript
import { askEventDocBundleApply, askEventDocTransferReadBundle, askEventDocTransferReadRegistry } from '@qpqjs/features';

export function* applyImport(transferId: string, importerUserId: string, force = false) {
  const registry = yield* askEventDocTransferReadRegistry();
  const bundle = yield* askEventDocTransferReadBundle(transferId);

  const rows = yield* askEventDocBundleApply(registry, bundle, { transferId, importerUserId, force });

  return rows; // EventDocTransferPlanRow[] — same shape as a plan, now with eventsWritten/assetsWritten filled in
}
```

## Signature

```typescript
function* askEventDocBundleApply(
  registry: EventDocTransferRegistry,
  bundle: EventDocBundle,
  options: EventDocBundleApplyOptions,
): AskResponse<EventDocTransferPlanRow[]>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `registry` | `EventDocTransferRegistry` | `{ service, collections }` — which collections the target may import into, as registered by [defineEventDocTransfer](../../../config/features/event-doc-transfer.md). |
| `bundle` | `EventDocBundle` | The staged bundle to apply, read with `askEventDocTransferReadBundle`. |
| `options` | `EventDocBundleApplyOptions` | See below. |

### `EventDocBundleApplyOptions`

| Property | Type | Description |
| --- | --- | --- |
| `transferId` | `string` | Which staged bundle this is, so a discarded (overwritten) tail is parked next to it. |
| `importerUserId` | `string` | The user id every imported event is attributed to. The source system's user id is deliberately **not** carried over — it resolves to nobody in the target directory — though the author's `userDisplayName` is kept, so history still reads as the person who wrote it. |
| `force` | `boolean` (optional) | Discard the target's divergent tail and take the bundle's version instead. Off by default and never implicit — it deletes events the target owns and rewrites published version history. Applies only to `diverged` rows; a `codeConflict` is a different problem overwriting cannot fix. |

## Returns

`EventDocTransferPlanRow[]` — one row per doc, in bundle order, same shape as [askEventDocBundlePlan](./ask-event-doc-bundle-plan.md#returns) but with `eventsWritten`/`assetsWritten`/`discardedEvents` now reflecting what was actually written.

## Errors

| Condition | Error |
| --- | --- |
| `bundle.formatVersion` doesn't match this deployment's `EVENT_DOC_TRANSFER_BUNDLE_FORMAT_VERSION` | `ErrorTypeEnum.BadRequest` |

## Related

- [askEventDocBundlePlan](./ask-event-doc-bundle-plan.md) — the read-only preview of what this would do.
- [askEventDocTransferExport](./ask-event-doc-transfer-export.md) — produces the bundle this applies.
- [defineEventDocTransfer](../../../config/features/event-doc-transfer.md) — mounts `POST /transfer/import`, the HTTP entry point for this story.
