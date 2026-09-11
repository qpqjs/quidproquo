---
title: defineCryptoKey
description: Define a crypto key, an application-level encryption key for askCryptoEncrypt / askCryptoDecrypt (a KMS CMK on AWS).
---

# defineCryptoKey

Declares a **crypto key**: a named encryption key stories use through [askCryptoEncrypt](../../actions/core/crypto/ask-crypto-encrypt.md) and [askCryptoDecrypt](../../actions/core/crypto/ask-crypto-decrypt.md). The key material never leaves the provider; your code only ever sees opaque ciphertext blobs.

- **On AWS:** provisions a KMS customer managed key with automatic rotation enabled, addressed by a deterministic alias derived from application/module/environment, and grants the service's role use of it (`kms:GenerateDataKey*`, `kms:Decrypt`, `kms:Encrypt`, `kms:DescribeKey`). Rotation needs nothing from the app: old key material stays available for decrypt.
- **On the dev server:** a local master key is seeded on first use at `.qpq-runtime/<app>/cryptoKeys/<service>.json`, so everything works offline with no AWS credentials.

One application-level key is usually enough. Separation between callers comes from the `context` on each encrypt (see [askCryptoEncrypt](../../actions/core/crypto/ask-crypto-encrypt.md)), not from separate keys.

```typescript
import { defineCryptoKey } from 'quidproquo-core';

export default [
  defineCryptoKey('app-crypto-key'),
];
```

## Signature

```typescript
function defineCryptoKey(
  keyName: string,
  options?: QPQConfigAdvancedCryptoKeySettings,
): CryptoKeyQPQConfigSetting;
```

## Parameters

### `keyName`: `string` (required)

The name of the key, and its `uniqueKey` within the config. This is the name you pass to the crypto actions.

### `options`: `QPQConfigAdvancedCryptoKeySettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `owner` | `CrossModuleOwner<'cryptoKeyName'>` | – | Declares that the key is owned by **another** module/service, so this service is granted use of it rather than creating its own. `{ module, application, feature, environment, cryptoKeyName }`, all optional; unset parts default to the current service. |

## Notes

- Ciphertext blobs are versioned (`qpqcrypto:v1:...`), so the underlying mechanism can evolve without re-encrypting stored data.
- Dev ciphertext is not readable in prod and vice versa; each environment's key is its own.

## Related

- [askCryptoEncrypt](../../actions/core/crypto/ask-crypto-encrypt.md): encrypts with this key.
- [askCryptoDecrypt](../../actions/core/crypto/ask-crypto-decrypt.md): decrypts with this key.
- [defineSigningKey](./signing-key.md): for signing and verifying (tokens, webhooks) rather than encrypting.
- [defineSecret](./secret.md): for platform-level secret values set out-of-band, rather than values your app encrypts itself.
