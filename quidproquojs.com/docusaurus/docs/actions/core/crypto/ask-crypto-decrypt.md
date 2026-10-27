---
title: askCryptoDecrypt
description: Decrypt a ciphertext produced by askCryptoEncrypt, verifying its context.
---

# askCryptoDecrypt

Decrypts a blob produced by [askCryptoEncrypt](./ask-crypto-encrypt.md) and returns the original string. The `context` supplied here must match the one supplied at encrypt time exactly, or the call fails before any plaintext is produced.

- **Action type:** `CryptoActionType.Decrypt`
- **On AWS:** unwraps the embedded data key with AWS KMS (`kms:Decrypt`, with the context as KMS encryption context, which also gives a per-context audit trail in CloudTrail) and decrypts locally with AES-256-GCM.
- **On the dev server:** identical code path against the local master key, including identical context enforcement. A context scoping bug fails the same way locally as in prod.

```typescript
import { askCryptoDecrypt, askKeyValueStoreGet } from '@qpqjs/core';

export function* askReadCustomerApiKey(customerId: string) {
  const record = yield* askKeyValueStoreGet('customer-credentials', customerId);

  return yield* askCryptoDecrypt('app-crypto-key', record.apiKey, { customerId });
}
```

## Signature

```typescript
function* askCryptoDecrypt(
  keyName: string,
  ciphertext: string,
  context?: CryptoContext,
): AskResponse<string>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `keyName` | `string` | Name of the crypto key, declared with [defineCryptoKey](../../../config/core/crypto-key.md) (or shared via its `owner` option). |
| `ciphertext` | `string` | A blob previously returned by [askCryptoEncrypt](./ask-crypto-encrypt.md). |
| `context` | `CryptoContext` | The same `Record<string, string>` supplied at encrypt time. Omitting it and passing `{}` are equivalent. |

## Returns

`string`: the original plaintext.

## Errors

Each failure mode is distinguishable because they need different handling:

| Error | Meaning |
| --- | --- |
| `CryptoDecryptErrorTypeEnum.ContextMismatch` | The supplied context differs from the encrypt-time context. Probable scoping bug in the caller; alert, do not retry. |
| `CryptoDecryptErrorTypeEnum.MalformedCiphertext` | The blob is corrupt, truncated, or not a qpq crypto blob. Data problem; the stored value needs re-creating. |
| `CryptoDecryptErrorTypeEnum.KeyNotConfigured` | No `defineCryptoKey` with that name exists in the service config. |
| `CryptoDecryptErrorTypeEnum.KeyUnavailable` | The key is disabled, deleted, or access was denied. Infrastructure problem; surface to ops. |
| `CryptoDecryptErrorTypeEnum.Throttling` | The provider rate limit was exceeded; back off and retry. |

## Related

- [askCryptoEncrypt](./ask-crypto-encrypt.md): produces the ciphertext, and documents how `context` works.
- [defineCryptoKey](../../../config/core/crypto-key.md): declares the key this action uses.
