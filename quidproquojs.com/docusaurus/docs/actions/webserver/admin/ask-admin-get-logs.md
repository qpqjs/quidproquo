---
title: askAdminGetLogs
description: List story-execution log summaries for a runtime type within a time window (paginated).
---

# askAdminGetLogs

Returns a paginated list of **story-execution log summaries** for a given runtime type within a time window. This is the entry point for an admin dashboard: it lists the top-level story executions (API requests, queue events, scheduled runs, and so on) so a user can pick one to drill into.

Every story that runs in a quidproquo service — an API request, a queue message, a deploy event — produces an execution log. `askAdminGetLogs` returns the lightweight [`StoryResultMetadata`](#the-log-model) summaries for those runs; use [askAdminGetLog](./ask-admin-get-log.md) to fetch the full detail of any one of them.

- **Action type:** `AdminActionType.GetLogs`

```typescript
import { askAdminGetLogs } from '@qpqjs/webserver';
import { QpqRuntimeType } from '@qpqjs/core';

export function* listRecentApiCalls() {
  const page = yield* askAdminGetLogs(
    QpqRuntimeType.API,
    '2026-07-01T00:00:00.000Z',
    '2026-07-07T00:00:00.000Z',
  );

  for (const entry of page.items) {
    // entry.correlation, entry.runtimeType, entry.executionTimeMs, entry.error, ...
  }

  return page.nextPageKey; // pass back in to fetch the next page
}
```

## Signature

```typescript
function* askAdminGetLogs(
  runtimeType: string,
  startIsoDateTime: string,
  endIsoDateTime: string,
  nextPageKey?: string,
): AskResponse<QpqLogList>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `runtimeType` | `string` | Which kind of story execution to list — the `QpqRuntimeType` value (e.g. `QpqRuntimeType.API`, `QpqRuntimeType.QUEUE_EVENT`, `QpqRuntimeType.RECURRING_SCHEDULE`). |
| `startIsoDateTime` | `string` | Start of the time window, as an ISO 8601 timestamp. Only logs at or after this time are returned. |
| `endIsoDateTime` | `string` | End of the time window, as an ISO 8601 timestamp. |
| `nextPageKey` | `string` | Optional. The `nextPageKey` returned by a previous call, to fetch the next page. Omit for the first page. |

## Returns

`QpqLogList` — a page of metadata summaries:

```typescript
export interface QpqLogList {
  items: StoryResultMetadata[];
  nextPageKey?: string;
}
```

`nextPageKey` is present when more results remain; pass it back in to continue paging. When it is absent, you have reached the end of the window.

## The log model

`items` are `StoryResultMetadata` — a compact summary of one story execution (no action history):

```typescript
export type StoryResultMetadata = {
  correlation: string;        // unique id for this story execution
  fromCorrelation?: string;   // correlation of the story that triggered this one (its parent)

  moduleName: string;
  runtimeType: QpqRuntimeType; // API / QUEUE_EVENT / DEPLOY_EVENT / ...

  startedAt: string;          // ISO timestamp

  generic: string;            // a generic label used to search / group logs
  error?: string;             // error text, if the story failed
  executionTimeMs: number;

  userInfo?: string;
  qpqFunctionRuntimeInfo?: QpqFunctionRuntime;
};
```

The `correlation` / `fromCorrelation` pair is what links stories into a tree: a parent story (say an API call) that triggers a sub-story (a queue message it sends) sets the child's `fromCorrelation` to the parent's `correlation`. Walk that tree with [askAdminGetLogMetadataChildren](./ask-admin-get-log-metadata-children.md).

## Related

- [askAdminGetLog](./ask-admin-get-log.md) — fetch the full execution log (with action history) for one `correlation`.
- [askAdminGetLogMetadata](./ask-admin-get-log-metadata.md) — fetch the summary for a single `correlation`.
- [askAdminGetLogMetadataChildren](./ask-admin-get-log-metadata-children.md) — page through the child stories of a `correlation`.
- [defineAdminSettings](../../../config/features/admin-settings.md) — declares the admin log-service backend these actions read from.
