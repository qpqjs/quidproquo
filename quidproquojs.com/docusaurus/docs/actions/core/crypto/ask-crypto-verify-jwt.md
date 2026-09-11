---
title: askCryptoVerifyJwt
description: Verify a compact RS256 JWT against a signing key and get its claims, or a reason it was rejected.
---

# askCryptoVerifyJwt

Verifies a compact JWT against a [signing key](../../../config/core/signing-key.md) and returns its claims. Built for untrusted input: it never throws on a bad token. Every way a token can be wrong comes back as `{ valid: false, reason }`, so a route can map it straight to a 401 without a try/catch.

Checks, in order: three base64url segments; header is JSON with `alg: "RS256"` (anything else, including `none`, is rejected before any verification); signature verifies under the key via [askCryptoVerify](./ask-crypto-verify.md); payload is a JSON object; `nbf` is not in the future and `exp` is not in the past, against QPQ time. Audience, issuer and every application claim are yours to check on the returned claims.

```typescript
import { askCryptoVerifyJwt, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

type AccessTokenClaims = { sub: string; grants: string[]; exp: number };

export function* askAuthenticateAccessToken(token: string) {
  const result = yield* askCryptoVerifyJwt<AccessTokenClaims>('access-token-key', token);

  if (!result.valid) {
    return yield* askThrowError(ErrorTypeEnum.Unauthorized, `Invalid access token: ${result.reason}`);
  }

  return result.claims;
}
```

## Signature

```typescript
function* askCryptoVerifyJwt<T extends object>(
  keyName: string,
  token: string,
): AskResponse<JwtVerifyResult<T>>;

type JwtVerifyResult<T> =
  | { valid: true; claims: T }
  | { valid: false; reason: JwtVerifyFailureReason };

type JwtVerifyFailureReason =
  | 'malformed'
  | 'unsupported-algorithm'
  | 'bad-signature'
  | 'not-yet-valid'
  | 'expired';
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `keyName` | `string` | Name of the signing key whose public half verifies the token. A service that only verifies declares the key with `owner` pointing at the issuing service. |
| `token` | `string` | The compact JWT as presented, e.g. the bearer value from an `Authorization` header. |

## Returns

`JwtVerifyResult<T>`: `{ valid: true, claims }` with the payload typed as `T`, or `{ valid: false, reason }`:

| Reason | Meaning |
| --- | --- |
| `malformed` | Not three base64url segments, or the header/payload is not a JSON object. |
| `unsupported-algorithm` | The header `alg` is not `RS256`. |
| `bad-signature` | The signature does not verify under the key. |
| `not-yet-valid` | `nbf` is later than now. |
| `expired` | `exp` is now or earlier. |

Time claims are compared as unix seconds; a token with neither `exp` nor `nbf` is accepted without reading the clock.

## Errors

Those of [askCryptoVerify](./ask-crypto-verify.md): a key that is not configured or not available is an infrastructure error, not a `valid: false` result. `MalformedSignature` cannot occur here, since the segments are validated as base64url first.

## Related

- [askCryptoSignJwt](./ask-crypto-sign-jwt.md): mints the tokens this verifies.
- [defineSigningKey](../../../config/core/signing-key.md): declares the key.
