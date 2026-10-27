---
title: askAdminGetLog
description: Fetch the full execution log — including action history — for a single story by its correlation id.
---

# askAdminGetLog

Fetches the **full execution log** for a single story, identified by its correlation id. Where [askAdminGetLogMetadata](./ask-admin-get-log-metadata.md) returns just a summary, this returns the complete `StoryResult` — including the entire `history` of actions the story yielded, their results, and timing. This is what an admin dashboard shows when a user opens a single log entry to inspect exactly what happened.

- **Action type:** `AdminActionType.GetLog`

```typescript
import { askAdminGetLog } from '@qpqjs/webserver';

export function* inspectStory(correlationId: string) {
  const log = yield* askAdminGetLog(correlationId);

  // log.history is the ordered list of every action the story ran
  for (const step of log.history) {
    // step.act (the action), step.res (its result), step.startedAt / step.finishedAt
  }

  return log.error ?? log.result;
}
```

## Signature

```typescript
function* askAdminGetLog(
  correlationId: string,
): AskResponse<StoryResult<any>>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `correlationId` | `string` | The `correlation` of the story to fetch — typically taken from a summary returned by [askAdminGetLogs](./ask-admin-get-logs.md) or [askAdminGetLogMetadata](./ask-admin-get-log-metadata.md). |

## Returns

`StoryResult<any>` — the complete execution record for the story:

```typescript
export interface StoryResult<TArgs extends Array<any>, TResult = any> {
  input: TArgs;                 // the arguments the story was called with
  session: StorySession;        // session data (correlation, context, access token, ...)
  history: ActionHistory[];     // every action yielded, with result and timing

  startedAt: string;
  finishedAt: string;

  fromCorrelation?: string;     // the parent story's correlation, if any
  correlation: string;          // this story's correlation

  tags: string[];
  moduleName: string;

  result?: TResult;             // the story's return value ...
  error?: QPQError;             // ... or the error it failed with (never both)

  runtimeType: QpqRuntimeType;
  logs?: qpqConsoleLog[];       // impure console logs captured during the run
  qpqFunctionRuntimeInfo?: QpqFunctionRuntime;
}
```

Each `history` entry is an `ActionHistory`:

```typescript
export interface ActionHistory<P = any, R = any> {
  act: Action<P>;      // the action that was run
  res: R;              // its result
  startedAt: string;
  finishedAt: string;
}
```

## Related

- [askAdminGetLogs](./ask-admin-get-logs.md) — list log summaries to find a `correlation` to fetch.
- [askAdminGetLogMetadata](./ask-admin-get-log-metadata.md) — the lightweight summary for the same `correlation` (no history).
- [askAdminGetLogMetadataChildren](./ask-admin-get-log-metadata-children.md) — page through the child stories this one triggered.
