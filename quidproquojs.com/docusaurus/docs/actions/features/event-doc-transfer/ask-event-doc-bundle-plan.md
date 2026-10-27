---
title: askEventDocBundlePlan
description: What importing an uploaded bundle would do to each of its docs, without writing anything.
---

# askEventDocBundlePlan

Computes what importing a bundle would do to **each** of its docs, writing nothing. This is the review gate: a UI shows these rows and the operator confirms before anything actually lands. Rows come back in bundle order (leaves-first, the same order [askEventDocBundleApply](./ask-event-doc-bundle-apply.md) applies them in), so the plan and the apply result read the same way.

Each doc is compared against the target's own log for the same id (see `findEventDocLogDivergence`) to decide its `EventDocTransferStatus`: a fresh `new` doc, a `fastForward` (the target's log is a strict prefix of the incoming one), an already-`same` no-op, or a blocking `diverged`/`codeConflict` row that nothing is written for unless the caller forces it.

- **Built from:** `askEventDocTransferProvideCollection` (runs each doc's comparison against its own collection's store) then `askEventDocBundlePlanDoc` (the per-doc comparison). Requires an `EventDocTransferRegistry` and a parsed `EventDocBundle` — the built-in `POST /transfer/plan` route resolves both from `{ transferId }` before calling this.

```typescript
import { askEventDocBundlePlan, askEventDocTransferReadBundle, askEventDocTransferReadRegistry } from '@qpqjs/features';

export function* reviewImport(transferId: string) {
  const registry = yield* askEventDocTransferReadRegistry();
  const bundle = yield* askEventDocTransferReadBundle(transferId);

  const rows = yield* askEventDocBundlePlan(registry, bundle);

  return rows; // EventDocTransferPlanRow[]
}
```

## Signature

```typescript
function* askEventDocBundlePlan(
  registry: EventDocTransferRegistry,
  bundle: EventDocBundle,
): AskResponse<EventDocTransferPlanRow[]>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `registry` | `EventDocTransferRegistry` | `{ service, collections }` — which collections the target may import into, as registered by [defineEventDocTransfer](../../../config/features/event-doc-transfer.md). |
| `bundle` | `EventDocBundle` | The staged bundle to evaluate (`{ formatVersion, source, docs }`), read with `askEventDocTransferReadBundle`. |

## Returns

`EventDocTransferPlanRow[]` — one row per doc in the bundle, in bundle order:

```typescript
type EventDocTransferPlanRow = EventDocDocRef & {
  code: string;
  name: string;
  status: EventDocTransferStatus; // 'new' | 'fastForward' | 'same' | 'diverged' | 'codeConflict' | 'overwritten' | 'ignored'
  incomingEvents: number;
  existingEvents: number;
  eventsWritten: number; // always 0 on a plan
  assetsWritten: number; // always 0 on a plan
  discardedEvents: number; // always 0 on a plan
  detail?: string; // why a blocking status blocks
};
```

`overwritten` never appears on a plan — it is report-only, produced by a forced [askEventDocBundleApply](./ask-event-doc-bundle-apply.md).

## Related

- [askEventDocBundleApply](./ask-event-doc-bundle-apply.md) — applies the same comparison and actually writes.
- [askEventDocTransferExport](./ask-event-doc-transfer-export.md) — produces the bundle a plan evaluates.
- [defineEventDocTransfer](../../../config/features/event-doc-transfer.md) — mounts `POST /transfer/plan`, the HTTP entry point for this story.
