---
title: askEventDocReadIdentity
description: Declaratively read where an event-doc's own document lives (serviceName/basePath/id), for verbs that build links relative to their own doc.
---

# askEventDocReadIdentity

The address sibling of [askEventDocReadState](./ask-event-doc-read-state.md): the story yields no payload at all, and a registered processor answers with the doc's own identity — `serviceName`, `basePath`, and `id`. Verbs written in terms of it (for example, building an `EventDocLink` relative to their own doc) stay workspace-blind, resolving whichever doc the processor is bound to.

- **Action type:** `EventDocActionType.ReadIdentity`
- **@qpqjs/features ships no default processor** for this action. Calling it with no processor registered fails loudly, the same as an unbound [askEventDocReadState](./ask-event-doc-read-state.md).
- Returns `null` until the doc has an identity to report: before the workspace initializes the slot, and always for an unsaved doc (it has no server-backed identity to resolve).

```typescript
import { askEventDocReadIdentity } from '@qpqjs/features';

export function* askTemplateBuildSelfLink() {
  const identity = yield* askEventDocReadIdentity();
  return identity ? { serviceName: identity.serviceName, basePath: identity.basePath, id: identity.id } : null;
}
```

## Signature

```typescript
function* askEventDocReadIdentity(): AskResponse<Nullable<EventDocWorkspaceDocumentIdentity>>;
```

## Parameters

None — WHICH doc's identity to read is the answering processor's ambient context, the same as `askEventDocReadState`.

## Returns

`AskResponse<Nullable<EventDocWorkspaceDocumentIdentity>>` — `{ serviceName, basePath, id }`, concretely typed since every doc's identity has the same shape. `null` until the doc is bound to a real document.

## Notes

- This is the contract only — it carries no default behavior. A runtime that answers `askEventDocReadState` for a doc should also answer `askEventDocReadIdentity` for it.
- In the event-doc workspace, the binding registered for a slot answers with `state.slots[slotKey].documentIdentity`, so this reflects the same identity `askInit` seeded for the slot.

## Related

- [askEventDocReadState](./ask-event-doc-read-state.md) — the content sibling: what the doc currently holds, rather than where it lives.
- [askApplyEventDocEvent](./ask-apply-event-doc-event.md) — the write action this doc's verbs typically pair with.
