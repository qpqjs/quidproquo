---
title: askLogDisableEventHistory
description: Stop the current story's full action-by-action event history from being persisted.
---

# askLogDisableEventHistory

Controls whether the **event history** — the recorded, replayable log of every action a story yielded — is persisted for the current execution.

- **Action type:** `LogActionType.DisableEventHistory`
- **On AWS:** when a story finishes, the runtime writes a `StoryResult` (including its `history` of processed actions) to the log storage drive (an S3 bucket) keyed by correlation id. Disabling event history for a correlation strips that `history` down to only the log entries (`Create`, `TemplateLiteral`, and `DisableEventHistory` actions) before it is written; all other actions are filtered out.

Every action a story runs — config reads, key-value lookups, network calls, and their inputs/outputs — is normally captured in this history so a run can be inspected or replayed. Disable it when a story handles **sensitive data** you do not want persisted (secrets, PII, payment details) or when the history would be **prohibitively large**. Your explicit log lines are still kept.

```typescript
import { askLogDisableEventHistory } from '@qpqjs/core';

export function* askHandlePayment(cardNumber: string) {
  // Don't persist the full action history for this run — it touches card data.
  yield* askLogDisableEventHistory(false, 'Handles raw card data');
  // ...
}
```

## Signature

```typescript
function* askLogDisableEventHistory(
  enable: boolean,
  reason: string,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `enable` | `boolean` | Whether event history is **enabled** for this correlation. Pass `false` to disable it (strip the history to log entries only); pass `true` to re-enable it. |
| `reason` | `string` | A human-readable note explaining why history was disabled or re-enabled. Recorded for audit purposes. |

## Returns

`void` — the story resumes once the setting has been applied.

## Notes

- The setting is scoped to the current execution's correlation id, not global.
- Log entries created with [askLogCreate](./ask-log-create.md) and [askLogTemplateLiteral](./ask-log-template-literal.md) are always retained even when event history is disabled.

## Related

- [askLogCreate](./ask-log-create.md) — write a log line that is kept regardless of this setting.
- [askLogTemplateLiteral](./ask-log-template-literal.md) — log an interpolated message.
