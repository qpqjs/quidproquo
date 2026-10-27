---
title: askAdminGetLogMetadataChildren
description: Page through the direct child stories that a given story triggered, as metadata summaries.
---

# askAdminGetLogMetadataChildren

Returns a paginated list of the **direct child stories** that a given story triggered — the sub-stories whose `fromCorrelation` equals this story's `correlation`. Stories form a tree: an API request may send a queue message, invoke a service function, or publish an event, each of which runs as its own story. This action walks one level of that tree, letting an admin dashboard expand a log entry to reveal the work it spawned.

- **Action type:** `AdminActionType.GetLogMetadataChildren`

```typescript
import { askAdminGetLogMetadataChildren } from '@qpqjs/webserver';

export function* walkChildren(correlationId: string) {
  const allChildren = [];
  let nextPageKey: string | undefined = undefined;

  do {
    const page = yield* askAdminGetLogMetadataChildren(correlationId, nextPageKey);
    allChildren.push(...page.items);
    nextPageKey = page.nextPageKey;
  } while (nextPageKey);

  return allChildren; // recurse into each child.correlation to build the full tree
}
```

## Signature

```typescript
function* askAdminGetLogMetadataChildren(
  correlationId: string,
  nextPageKey?: string,
): AskResponse<QpqLogList>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `correlationId` | `string` | The `correlation` of the parent story whose direct children to list. |
| `nextPageKey` | `string` | Optional. The `nextPageKey` from a previous call, to fetch the next page. Omit for the first page. |

## Returns

`QpqLogList` — a page of child metadata summaries:

```typescript
export interface QpqLogList {
  items: StoryResultMetadata[];  // direct children (one level down the tree)
  nextPageKey?: string;
}
```

Each item is a `StoryResultMetadata` (see [askAdminGetLogMetadata](./ask-admin-get-log-metadata.md) for its shape). `nextPageKey` is present when more children remain. To build the full execution tree, recurse: call this action again with each child's `correlation`. The framework also models the fully-expanded tree as `StoryResultMetadataWithChildren` (`StoryResultMetadata` plus a `children` array).

## Related

- [askAdminGetLogMetadata](./ask-admin-get-log-metadata.md) — the summary shape returned in `items`.
- [askAdminGetLog](./ask-admin-get-log.md) — the full log for any child `correlation`.
- [askAdminGetLogs](./ask-admin-get-logs.md) — list top-level stories to start from.
