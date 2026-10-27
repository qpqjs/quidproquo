---
title: askUserDirectoryDecodeAccessToken
description: Verify and decode an access token into its claims.
---

# askUserDirectoryDecodeAccessToken

Verifies and decodes an access token issued by a [user directory](../../../config/core/user-directory.md), returning the identity claims it carries. Use it to validate a token you have been handed (e.g. a bearer token on an incoming request) and read who it belongs to.

- **Action type:** `UserDirectoryActionType.DecodeAccessToken`
- **On AWS:** verifies the JWT signature against the pool's public JWKs over HTTPS — no Cognito API call and no IAM required, so it works against foreign directories too.

```typescript
import { askUserDirectoryDecodeAccessToken } from '@qpqjs/core';

export function* askWhoIs(accessToken: string) {
  const decoded = yield* askUserDirectoryDecodeAccessToken('app-users', false, accessToken);
  return decoded.userId;
}
```

## Signature

```typescript
function* askUserDirectoryDecodeAccessToken(
  userDirectoryName: string,
  ignoreExpiration: boolean,
  accessToken: string,
): AskResponse<DecodedAccessToken>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `userDirectoryName` | `string` | Name of the directory that issued the token — must match a directory declared with [defineUserDirectory](../../../config/core/user-directory.md). |
| `ignoreExpiration` | `boolean` | When `true`, an expired token is still decoded rather than rejected. |
| `accessToken` | `string` | The access token to verify and decode. |

## Returns

`DecodedAccessToken`:

```typescript
interface DecodedAccessToken {
  userId: string;
  username: string;
  exp: number;
  roles?: string[];
  userDirectory: string;
  wasValid: boolean;
}
```

- `userId` — the user's unique identifier (the Cognito `sub`).
- `username` — the user's username.
- `exp` — expiry as a Unix timestamp (seconds since 1970-01-01 UTC).
- `roles` — the user's roles, if any.
- `userDirectory` — the directory the token belongs to.
- `wasValid` — whether the token's signature/expiry validated.

## Errors

| Error | Meaning |
| --- | --- |
| `UserDirectoryDecodeAccessTokenErrorTypeEnum.Unauthorized` | The access token is missing, malformed, expired, or its signature could not be verified. |

## Related

- [askUserDirectoryReadAccessToken](./ask-user-directory-read-access-token.md) — decode the token already on the current story session.
- [askUserDirectorySetAccessToken](./ask-user-directory-set-access-token.md) — load and decode a token into the session.
- [defineUserDirectory](../../../config/core/user-directory.md) — declares the directory.
- [askRouteAuthValidationDecode](../../webserver/route-auth-validation/ask-route-auth-validation-decode.md) — the webserver route-auth wrapper that decodes an incoming request's token.
