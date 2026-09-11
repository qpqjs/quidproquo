---
title: askCryptoGetPublicKey
description: Read the public half of a signing key as an SPKI PEM, for third parties to verify with.
---

# askCryptoGetPublicKey

Returns the public half of a [signing key](../../../config/core/signing-key.md) as an SPKI PEM string. It is not sensitive: it can only verify, never sign. Hand it to anyone who needs to check your signatures without calling back in, for example from a `/.well-known/jwks.json` route or a partner integration.

- **Action type:** `CryptoActionType.GetPublicKey`
- **On AWS:** `kms:GetPublicKey`, cached per runtime for an hour.
- **On the dev server:** the public half of the locally seeded pair.

```typescript
import { askCryptoGetPublicKey } from 'quidproquo-core';

export function* askGetTokenVerificationKey() {
  return yield* askCryptoGetPublicKey('access-token-key');
}
```

## Signature

```typescript
function* askCryptoGetPublicKey(
  keyName: string,
): AskResponse<string>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `keyName` | `string` | Name of the signing key, declared with [defineSigningKey](../../../config/core/signing-key.md) (or shared via its `owner` option). |

## Returns

`string`: the public key as a PEM block (`-----BEGIN PUBLIC KEY-----` … `-----END PUBLIC KEY-----`), SubjectPublicKeyInfo encoding, as accepted by every JWT library and `openssl`.

## Errors

| Error | Meaning |
| --- | --- |
| `askCryptoGetPublicKey.errorType.KeyNotConfigured` | No `defineSigningKey` with that name exists in the service config. |
| `askCryptoGetPublicKey.errorType.KeyUnavailable` | The key exists in config but is disabled, deleted, or access was denied. |
| `askCryptoGetPublicKey.errorType.Throttling` | The provider rate limit was exceeded; back off and retry. |

## Related

- [defineSigningKey](../../../config/core/signing-key.md): declares the key this action uses.
- [askCryptoVerify](./ask-crypto-verify.md): verifies in-process without exposing the key.
