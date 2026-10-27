---
title: askGetRuntimeCorrelation
description: Get the correlation id of the currently executing story.
---

# askGetRuntimeCorrelation

Returns the **correlation id** (a guid) of the story that is currently running. Every action a story processes — and every sub-story it triggers — shares this correlation, so it is the handle that links a whole execution together in the logs and execution history.

- **Action type:** `SystemActionType.GetRuntimeCorrelation`

```typescript
import { askGetRuntimeCorrelation } from '@qpqjs/core';

export function* askRecordJob() {
  const correlation = yield* askGetRuntimeCorrelation();

  // Store it so we can later link back to this execution's logs.
  yield* askKvsUpsert('jobs', { id: correlation, status: 'started' });

  return correlation;
}
```

## Signature

```typescript
function* askGetRuntimeCorrelation(): AskResponse<string>;
```

## Parameters

None.

## Returns

`string` — the correlation guid of the current story (`session.correlation`). It is stable for the whole execution, so reading it at different points in the same story yields the same value.

## Notes

- Persist this value when you want to correlate an out-of-band record (a KVS row, a queued message, an emitted event) back to the execution that produced it — the admin log viewer keys on the same correlation.
- Sub-stories run via [askExecuteStory](./ask-execute-story.md) carry a link to their caller's correlation, which is how nested executions stay traceable to their parent.

## Related

- [askExecuteStory](./ask-execute-story.md) — runs another story; correlations chain from caller to callee.
