---
title: askStateRead
description: Read the current in-story state accumulated from dispatched effects.
---

# askStateRead

Reads the current state that surrounds the story — the value accumulated from every [askStateDispatch](./ask-state-dispatch.md) processed so far. It is the read side of quidproquo's Redux-style in-story state: dispatch mutates, `askStateRead` observes. Under [askReduceState](./ask-reduce-state.md) it returns the whole reduced state; under the React `useQPQ` runtime it returns the current store state.

- **Action type:** `StateActionType.Read`

```typescript
import { askStateRead } from '@qpqjs/core';

export function* askGetCount() {
  const state = yield* askStateRead<CounterState>();
  return state.count;
}
```

## Signature

```typescript
function* askStateRead<R>(path?: string): AskResponse<R>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `path` | `string` | Optional. Reserved for reading a sub-path of the state. **Path reads are not supported by any current runtime** — the whole state is always returned regardless of `path`. |

## Returns

`R` — the current accumulated state. The generic `R` is the shape you expect the state to have; it is returned as-is, so it is your responsibility to type it correctly.

## Notes

- The value reflects the state **at the point of the read** — reads issued between dispatches see the partially-accumulated state, not the final one.
- Under [askReduceState](./ask-reduce-state.md), a read always returns that call's own accumulated state — a nested `askReduceState` reads its inner state, not the parent's.

## Related

- [askStateDispatch](./ask-state-dispatch.md) — dispatch effects that update the state this reads.
- [askReduceState](./ask-reduce-state.md) — run a story purely for its dispatched effects and return the reduced state.
