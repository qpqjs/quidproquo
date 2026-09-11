---
title: askCryptoVerify
description: Verify a base64url RS256 signature against a message using a signing key's public half.
---

# askCryptoVerify

Checks that `signature` was produced over `message` by the private half of a [signing key](../../../config/core/signing-key.md). Resolves to `true` or `false`; a signature that is not even decodable is a `MalformedSignature` error rather than `false`, so a wiring bug is distinguishable from a forged token. Most stories want [askCryptoVerifyJwt](./ask-crypto-verify-jwt.md) instead.

- **Action type:** `CryptoActionType.Verify`
- **On AWS:** verified in-process against the key's public half, fetched once per runtime with `kms:GetPublicKey` and cached for an hour. No KMS call on the hot path and no `kms:Verify` grant needed.
- **On the dev server:** the same check against the locally seeded pair.

```typescript
import { askCryptoVerify } from 'quidproquo-core';

export function* askIsWebhookBodyAuthentic(body: string, signature: string) {
  return yield* askCryptoVerify('webhook-signing-key', body, signature);
}
```

## Signature

```typescript
function* askCryptoVerify(
  keyName: string,
  message: string,
  signature: string,
): AskResponse<boolean>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `keyName` | `string` | Name of the signing key, declared with [defineSigningKey](../../../config/core/signing-key.md) (or shared via its `owner` option). |
| `message` | `string` | The exact string that was signed. |
| `signature` | `string` | The base64url signature from [askCryptoSign](./ask-crypto-sign.md). |

## Returns

`boolean`: `true` when the signature verifies under the key, `false` otherwise (wrong key, altered message, altered signature).

## Errors

| Error | Meaning |
| --- | --- |
| `askCryptoVerify.errorType.KeyNotConfigured` | No `defineSigningKey` with that name exists in the service config. |
| `askCryptoVerify.errorType.MalformedSignature` | `signature` is not base64url. Probable encoding bug at the caller, not an attack; do not treat as `false`. |
| `askCryptoVerify.errorType.KeyUnavailable` | The key exists in config but is disabled, deleted, or access was denied. |
| `askCryptoVerify.errorType.Throttling` | The provider rate limit was exceeded; back off and retry. |

## Related

- [defineSigningKey](../../../config/core/signing-key.md): declares the key this action uses.
- [askCryptoSign](./ask-crypto-sign.md): produces the signature.
- [askCryptoVerifyJwt](./ask-crypto-verify-jwt.md): verifies a whole JWT, including its time claims.
