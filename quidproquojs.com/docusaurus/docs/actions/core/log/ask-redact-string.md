---
title: askRedactString
description: Mark a value as sensitive so the admin log redaction removes it from the story's log.
---

# askRedactString

Marks a string value as sensitive in this story's log. The admin log redaction removes it from every string in the log, including entries recorded before this call and this call's own entry.

- **Action type:** `LogActionType.RedactString`
- **At runtime:** does nothing. The marking is read later by the admin log redaction when the log is viewed.

```typescript
import { askRedactString } from 'quidproquo-core';

export function* askHandleWebhook(signingSecret: string) {
  yield* askRedactString(signingSecret);
  // ...
}
```

## Signature

```typescript
function* askRedactString(value: string): AskResponse<void>;
```

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | – | The exact value to remove from the log. |

## Returns

`void`: the story resumes immediately.

## Notes

- Only this story's log is covered. A value handed to another service (in a queue message, an email, a service function) must be marked there too.
- [askSecureTokenGenerate](../secure-token/ask-secure-token-generate.md) results are treated as secrets automatically, so they don't need to be marked.

## Related

- [askSecureTokenGenerate](../secure-token/ask-secure-token-generate.md): generate a random secret token.
- [askLogDisableEventHistory](./ask-log-disable-event-history.md): stop the full action history being persisted.
