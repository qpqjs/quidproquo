---
title: askEventDocReadState
description: Declaratively read an event-doc's current folded state, leaving WHICH doc and HOW it is resolved to a registered processor.
---

# askEventDocReadState

The read counterpart of [askApplyEventDocEvent](./ask-apply-event-doc-event.md): the story yields no payload at all, and a registered processor answers with the doc's current folded state. Because it has no target of its own, verbs written in terms of it (a domain's read-to-derive-a-write action creators) run unchanged wherever a processor for it is registered, resolving whichever doc the processor is bound to.

- **Action type:** `EventDocActionType.ReadState`
- **@qpqjs/features ships no default processor** for this action. Calling it with no processor registered fails loudly, the same as an unbound [askApplyEventDocEvent](./ask-apply-event-doc-event.md).
- Returns `unknown` — the raw action can't know a slot's view type. Call it through a per-doc `createEventDocStateReader<TView>()` instead of directly, for a typed result.
- In the event-doc workspace, the binding registered for a slot answers with the doc's current memoized view (history + pending folded and migrated to latest), so a commit earlier in the same story is visible to a read that follows it.

```typescript
import { askEventDocReadState } from '@qpqjs/features';

export function* askTemplateAppendLine(line: string) {
  const template = (yield* askEventDocReadState()) as TemplateState;
  yield* askApplyEventDocEvent<AppendLineEffect>(TemplateEffect.AppendLine, { line: template.body ? `${template.body}\n${line}` : line });
}
```

## Signature

```typescript
function* askEventDocReadState(): AskResponse<unknown>;
```

## Parameters

None — WHICH doc to read is the answering processor's ambient context, the same as `askApplyEventDocEvent`'s target.

## Returns

`AskResponse<unknown>` — the doc's current folded state, untyped at this layer. Use `createEventDocStateReader<TView>()` to mint a typed `askRead<Doc>()` for a specific doc instead of casting the result by hand at every call site.

## Notes

- This is the contract only — it carries no default behavior. A runtime that answers `askApplyEventDocEvent` for a doc should also answer `askEventDocReadState` for it, so read-to-derive-a-write verbs work the same way commits do.
- `createEventDocDefinition` mints the doc's fold config and api together; pair it with a standalone `createEventDocStateReader<TView>()` for the doc's typed read verb.

## Related

- [askApplyEventDocEvent](./ask-apply-event-doc-event.md) — the write counterpart this action mirrors.
- [askEventDocReadIdentity](./ask-event-doc-read-identity.md) — the address sibling: where the doc lives, rather than what it currently holds.
