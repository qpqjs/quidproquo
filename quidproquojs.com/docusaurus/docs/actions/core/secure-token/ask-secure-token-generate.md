---
title: askSecureTokenGenerate
description: Generate a random token from the platform's secure random source, for use as a secret.
---

# askSecureTokenGenerate

Generates a new random token to use as a secret (a signing link, an API secret) and returns it as lowercase hex.

- **Action type:** `SecureTokenActionType.Generate`
- **At runtime:** reads `byteLength` bytes from the platform's Web Crypto random source (`crypto.getRandomValues`) and hex encodes them. There is no `Math.random()` fallback: if no secure source exists, the action fails.

The admin log redaction treats the result as a secret. It is blanked in this action's own log entry and swept from every other string in the story's log.

```typescript
import { askSecureTokenGenerate } from 'quidproquo-core';

export function* askCreateInviteLink(baseUrl: string) {
  const token = yield* askSecureTokenGenerate();
  return `${baseUrl}/invite/${token}`;
}
```

## Signature

```typescript
function* askSecureTokenGenerate(byteLength?: number): AskResponse<string>;
```

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `byteLength` | `number` | `32` | Number of random bytes. Must be a whole number from 1 to `SECURE_TOKEN_MAX_BYTE_LENGTH` (1024). |

## Returns

`string`: the token as lowercase hex, two characters per byte. The default of 32 bytes (256 bits) gives 64 characters.

## Errors

| Error | Meaning |
| --- | --- |
| `InvalidByteLength` | `byteLength` is not a whole number from 1 to `SECURE_TOKEN_MAX_BYTE_LENGTH`. |
| `RandomSourceUnavailable` | The runtime has no Web Crypto API. |

## Notes

- Only this story's log is covered by redaction. If you hand the token to another service (in a queue message, an email, a service function), mark it there too with [askRedactString](../log/ask-redact-string.md).

## Related

- [askRedactString](../log/ask-redact-string.md): mark any other value as sensitive in the log.
- [askNewGuid](../guid/ask-new-guid.md): a random id for identifying things, not for use as a secret.
