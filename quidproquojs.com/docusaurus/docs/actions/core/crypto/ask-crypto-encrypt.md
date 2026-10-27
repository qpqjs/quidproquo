---
title: askCryptoEncrypt
description: Encrypt a value with a configured crypto key, optionally bound to a context.
---

# askCryptoEncrypt

Encrypts a string with a [crypto key](../../../config/core/crypto-key.md) and returns an opaque, versioned ciphertext blob. Store the blob anywhere (a key value store, an event doc); only [askCryptoDecrypt](./ask-crypto-decrypt.md) can read it back.

- **Action type:** `CryptoActionType.Encrypt`
- **On AWS:** envelope encryption backed by AWS KMS. A data key is generated under the CMK (`kms:GenerateDataKey`) and the value is encrypted locally with AES-256-GCM, so there is no practical size limit and most calls never leave the process (data keys are cached briefly). The key itself is provisioned by [defineCryptoKey](../../../config/core/crypto-key.md).
- **On the dev server:** the same envelope code runs against a local master key seeded at `.qpq-runtime/<app>/cryptoKeys/<service>.json`. No AWS credentials or network needed. Dev ciphertext is not readable in prod (or on another machine), and that is intentional.

```typescript
import { askCryptoEncrypt, askKeyValueStoreUpdate } from '@qpqjs/core';

export function* askStoreCustomerApiKey(customerId: string, apiKey: string) {
  const ciphertext = yield* askCryptoEncrypt('app-crypto-key', apiKey, { customerId });

  yield* askKeyValueStoreUpdate('customer-credentials', { customerId, apiKey: ciphertext });
}
```

## Context

`context` is an optional `Record<string, string>` mixed into the encryption as additional authenticated data. The crypto layer treats it as opaque: it does not know or care what the keys mean. Supplying it buys two things:

- **Binding.** The ciphertext is only valid under the same context. A blob encrypted with `{ customerId: 'a' }` cannot be decrypted with `{ customerId: 'b' }`, so copying it to another row makes it undecryptable rather than readable.
- **Non-forgeability.** The association lives inside the authentication tag, not in an editable field beside the ciphertext. Forging it would require the key.

Context values are **not encrypted and not secret**. On AWS they are sent to KMS as encryption context and appear in CloudTrail in the clear, so never put sensitive values in them. Omitting `context` and passing `{}` are equivalent.

## Signature

```typescript
function* askCryptoEncrypt(
  keyName: string,
  plaintext: string,
  context?: CryptoContext,
): AskResponse<string>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `keyName` | `string` | Name of the crypto key, declared with [defineCryptoKey](../../../config/core/crypto-key.md) (or shared via its `owner` option). |
| `plaintext` | `string` | The value to encrypt. |
| `context` | `CryptoContext` | Optional `Record<string, string>` bound into the ciphertext; the same values must be supplied at decrypt. |

## Returns

`string`: an opaque, versioned ciphertext blob (`qpqcrypto:v1:...`). Treat it as a black box; its internal format can change between versions without a migration.

## Errors

| Error | Meaning |
| --- | --- |
| `CryptoEncryptErrorTypeEnum.KeyNotConfigured` | No `defineCryptoKey` with that name exists in the service config. |
| `CryptoEncryptErrorTypeEnum.KeyUnavailable` | The key exists in config but is disabled, deleted, or access was denied. Infrastructure problem; surface to ops. |
| `CryptoEncryptErrorTypeEnum.Throttling` | The provider rate limit was exceeded; back off and retry. |

## Related

- [defineCryptoKey](../../../config/core/crypto-key.md): declares the key this action uses.
- [askCryptoDecrypt](./ask-crypto-decrypt.md): reads the value back.
