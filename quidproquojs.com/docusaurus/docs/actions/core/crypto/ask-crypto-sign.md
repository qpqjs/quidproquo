---
title: askCryptoSign
description: Sign a message with a signing key's private half and get back a base64url RS256 signature.
---

# askCryptoSign

Signs a string with a [signing key](../../../config/core/signing-key.md) and returns the RS256 signature as unpadded base64url. The private key never leaves the provider; the story only ever sees the signature. Most stories want [askCryptoSignJwt](./ask-crypto-sign-jwt.md) instead, which builds the JWT framing around this.

- **Action type:** `CryptoActionType.Sign`
- **On AWS:** one `kms:Sign` call (`RSASSA_PKCS1_V1_5_SHA_256`) against the key provisioned by [defineSigningKey](../../../config/core/signing-key.md).
- **On the dev server:** the same signature computed with Node's `crypto` against the locally seeded pair at `.qpq-runtime/<app>/signingKeys/<service>.json`.

```typescript
import { askCryptoSign } from 'quidproquo-core';

export function* askSignWebhookBody(body: string) {
  return yield* askCryptoSign('webhook-signing-key', body);
}
```

## Signature

```typescript
function* askCryptoSign(
  keyName: string,
  message: string,
): AskResponse<string>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `keyName` | `string` | Name of the signing key, declared with [defineSigningKey](../../../config/core/signing-key.md) (or shared via its `owner` option). |
| `message` | `string` | The exact bytes (UTF-8) to sign. Verification must be given the identical string. |

## Returns

`string`: the signature, base64url encoded without padding. RS256 is deterministic, so the same key and message always return the same value.

## Errors

| Error | Meaning |
| --- | --- |
| `askCryptoSign.errorType.KeyNotConfigured` | No `defineSigningKey` with that name exists in the service config. |
| `askCryptoSign.errorType.KeyUnavailable` | The key exists in config but is disabled, deleted, or access was denied. Infrastructure problem; surface to ops. |
| `askCryptoSign.errorType.Throttling` | The provider rate limit was exceeded; back off and retry. |

## Related

- [defineSigningKey](../../../config/core/signing-key.md): declares the key this action uses.
- [askCryptoVerify](./ask-crypto-verify.md): checks a signature.
- [askCryptoSignJwt](./ask-crypto-sign-jwt.md): mints a JWT with this action.
