---
title: askParallelDEPRECATED
description: Deprecated — run several stories in parallel. Use askRunParallel instead.
---

# askParallelDEPRECATED

:::warning Deprecated
`askParallelDEPRECATED` is the original implementation for running stories in parallel. It has been replaced by [askRunParallel](./ask-run-parallel.md), which is more efficient and fully type-supported. Use `askRunParallel` in new code.
:::

Runs any number of stories in parallel by driving each generator forward and batching their outstanding actions together on each step. It exists only for backwards compatibility.

- **Built from:** [askBatch](./ask-batch.md) — on every step it collects the not-yet-done stories' current actions and processes them as a single batch, then feeds each result back into the corresponding story.

```typescript
import { askParallelDEPRECATED } from '@qpqjs/core';

export function* askLoadTwo(aId: string, bId: string) {
  // Prefer askRunParallel for new code — this is here for reference only.
  const results = yield* askParallelDEPRECATED([
    [askLoadA, aId],
    [askLoadB, bId],
  ]);

  return results;
}
```

## Signature

```typescript
function* askParallelDEPRECATED(
  stories: Array<any>,
): AskResponse<any[]>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `stories` | `Array<any>` | An array of `[storyFn, ...args]` tuples. Each entry is a story generator function followed by the arguments to call it with; the function is invoked internally and stepped in parallel with the others. |

## Returns

`any[]` — an array of the stories' return values, in the same order as the input. The type is untyped (`any`), which is one of the reasons it was superseded.

## Notes

- The calling convention differs from its replacement: this function takes `[fn, ...args]` tuples and calls the functions for you, whereas [askRunParallel](./ask-run-parallel.md) takes already-invoked generators (`[askLoadA(aId), askLoadB(bId)]`) and returns a precisely typed tuple.

## Related

- [askRunParallel](./ask-run-parallel.md) — the supported replacement.
- [askBatch](./ask-batch.md) — the batching primitive both are built on.
