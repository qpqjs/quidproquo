---
title: askGetApplicationVersion
description: Read the deployed application version, or null if it isn't set.
---

# askGetApplicationVersion

Returns the deployed application version — the value stored in the well-known `qpq-application-version` [global](../../../config/core/global.md) — or `null` if it hasn't been set. The version is typically something that identifies the deployed code, like a git SHA or build number, and is most useful in logs to tie a story execution back to the exact code that ran.

- **Built from:** [askConfigGetGlobal](./ask-config-get-global.md), wrapped in [askCatch](../system/ask-catch.md) so a missing/unreadable global resolves to `null` instead of throwing.

```typescript
import { askGetApplicationVersion } from '@qpqjs/core';

export function* askTagWithVersion(payload: Record<string, unknown>) {
  const version = yield* askGetApplicationVersion();
  return { ...payload, appVersion: version ?? 'unknown' };
}
```

## Signature

```typescript
function* askGetApplicationVersion(): AskResponse<string | null>;
```

## Returns

`string | null` — the application version, or `null` when the `qpq-application-version` global is not set (or can't be read).

## Notes

- The version is read from config as a global, so this works on any runtime with no external call.
- The event-processing pipeline ([askProcessEvent](../event/ask-process-event.md)) calls this at the start of handling every event, purely so the version lands in the logs.

## Related

- [defineApplicationVersion](../../../config/core/application-version.md) — sets the version this reads.
- [askConfigGetGlobal](./ask-config-get-global.md) — the underlying global read.
