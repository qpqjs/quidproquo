---
title: askUserDirectoryRefreshToken
description: Exchange a refresh token for a fresh set of access and id tokens.
---

# askUserDirectoryRefreshToken

Exchanges a previously issued refresh token for a fresh set of tokens against a [user directory](../../../config/core/user-directory.md), without the user re-entering credentials.

- **Action type:** `UserDirectoryActionType.RefreshToken`
- **On AWS:** issues Cognito `AdminInitiateAuth` with the `REFRESH_TOKEN_AUTH` flow.

```typescript
import { askUserDirectoryRefreshToken } from '@qpqjs/core';

export function* askRenewSession(refreshToken: string) {
  const result = yield* askUserDirectoryRefreshToken('app-users', refreshToken);
  return result.authenticationInfo; // fresh access / id tokens
}
```

## Signature

```typescript
function* askUserDirectoryRefreshToken(
  userDirectoryName: string,
  refreshToken: string,
): AskResponse<AuthenticateUserResponse>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `userDirectoryName` | `string` | Name of the directory — must match a directory declared with [defineUserDirectory](../../../config/core/user-directory.md). |
| `refreshToken` | `string` | The refresh token issued by a prior authentication (from `AuthenticationInfo.refreshToken`). |

## Returns

`AuthenticateUserResponse` — the same shape returned by [askUserDirectoryAuthenticateUser](./ask-user-directory-authenticate-user.md#returns). `authenticationInfo` holds the refreshed access and id tokens.

## Errors

| Error | Meaning |
| --- | --- |
| `UserDirectoryRefreshTokenErrorTypeEnum.Unauthorized` | The access token is missing/invalid, or the refresh token was rejected (expired/revoked) — the caller must re-authenticate. |
| `UserDirectoryRefreshTokenErrorTypeEnum.LimitExceeded` | Too many refresh attempts; back off and retry later. |

## Related

- [askUserDirectoryAuthenticateUser](./ask-user-directory-authenticate-user.md) — the initial sign-in that issues the refresh token.
- [askUserDirectoryRespondToAuthChallenge](./ask-user-directory-respond-to-auth-challenge.md) — completes challenges before tokens are issued.
- [defineUserDirectory](../../../config/core/user-directory.md) — declares the directory.
