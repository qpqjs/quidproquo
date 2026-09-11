---
title: askCryptoSignJwt
description: Mint a compact RS256 JWT over a claims object with a signing key.
---

# askCryptoSignJwt

Builds a compact JWT (`header.payload.signature`) over `claims`, signed RS256 with a [signing key](../../../config/core/signing-key.md). A story-level helper over [askCryptoSign](./ask-crypto-sign.md): the header is fixed at `{ "alg": "RS256", "typ": "JWT" }`, both segments are base64url, and the signature comes from the key's private half without it ever entering the story.

Every time-based claim (`exp`, `nbf`, `iat`) must already be on `claims`, sourced from QPQ time, so the story stays deterministic. Nothing is added or rewritten.

```typescript
import { askCryptoSignJwt, askGetCurrentEpoch } from 'quidproquo-core';

export function* askIssueAccessToken(clientId: string, grants: string[]) {
  const now = yield* askGetCurrentEpoch();

  return yield* askCryptoSignJwt('access-token-key', {
    sub: clientId,
    grants,
    exp: now + 3600,
  });
}
```

## Signature

```typescript
function* askCryptoSignJwt(
  keyName: string,
  claims: object,
): AskResponse<string>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `keyName` | `string` | Name of the signing key, declared with [defineSigningKey](../../../config/core/signing-key.md). |
| `claims` | `object` | The JWT payload, serialised with `JSON.stringify`. Put `exp`/`nbf` here as unix seconds if you want [askCryptoVerifyJwt](./ask-crypto-verify-jwt.md) to enforce them. |

## Returns

`string`: the compact JWT.

## Errors

Those of [askCryptoSign](./ask-crypto-sign.md).

## Related

- [askCryptoVerifyJwt](./ask-crypto-verify-jwt.md): the matching verifier.
- [defineSigningKey](../../../config/core/signing-key.md): declares the key.
