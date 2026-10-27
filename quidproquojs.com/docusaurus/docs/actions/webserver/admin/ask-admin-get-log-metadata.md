---
title: askAdminGetLogMetadata
description: Fetch the lightweight metadata summary for a single story by its correlation id.
---

# askAdminGetLogMetadata

Fetches the **metadata summary** for a single story, identified by its correlation id. This is the compact form of a log entry — runtime type, timing, error text, and the `correlation` / `fromCorrelation` links — without the full action history. Use it when you need one story's summary (for example, to resolve a `fromCorrelation` back to its parent); use [askAdminGetLog](./ask-admin-get-log.md) when you need the full detail.

- **Action type:** `AdminActionType.GetLogMetadata`

```typescript
import { askAdminGetLogMetadata } from '@qpqjs/webserver';

export function* summariseStory(correlationId: string) {
  const meta = yield* askAdminGetLogMetadata(correlationId);
  return {
    runtimeType: meta.runtimeType,
    tookMs: meta.executionTimeMs,
    failed: !!meta.error,
    parent: meta.fromCorrelation,
  };
}
```

## Signature

```typescript
function* askAdminGetLogMetadata(
  correlationId: string,
): AskResponse<StoryResultMetadata>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `correlationId` | `string` | The `correlation` of the story whose summary to fetch. |

## Returns

`StoryResultMetadata` — a compact summary of one story execution (no action history):

```typescript
export type StoryResultMetadata = {
  correlation: string;         // unique id for this story execution
  fromCorrelation?: string;    // correlation of the story that triggered this one

  moduleName: string;
  runtimeType: QpqRuntimeType;

  startedAt: string;

  generic: string;             // generic label used to search / group logs
  error?: string;              // error text, if the story failed
  executionTimeMs: number;

  userInfo?: string;
  qpqFunctionRuntimeInfo?: QpqFunctionRuntime;
};
```

## Related

- [askAdminGetLog](./ask-admin-get-log.md) — the full execution log (with action history) for the same `correlation`.
- [askAdminGetLogMetadataChildren](./ask-admin-get-log-metadata-children.md) — page through the child stories of this `correlation`.
- [askAdminGetLogs](./ask-admin-get-logs.md) — list summaries across a runtime type and time window.
