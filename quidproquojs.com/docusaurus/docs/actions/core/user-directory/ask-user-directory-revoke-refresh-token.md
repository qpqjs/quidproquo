---
title: askUserDirectoryRevokeRefreshToken
description: Revoke a single refresh token — the "log out this device" primitive.
---

# askUserDirectoryRevokeRefreshToken

Revokes a single refresh token (and every access token minted from it) against a [user directory](../../../config/core/user-directory.md). This is the "log out this device" primitive: other sessions belonging to the same user, holding different refresh tokens, are unaffected.

- **Action type:** `UserDirectoryActionType.RevokeRefreshToken`
- **On AWS:** issues Cognito `RevokeToken`. Requires token revocation to be enabled on the app client (the CDK default); a disabled client surfaces as an unmapped error.

```typescript
import { askUserDirectoryRevokeRefreshToken } from '@qpqjs/core';

export function* askLogOutThisDevice(refreshToken: string) {
  yield* askUserDirectoryRevokeRefreshToken('app-users', refreshToken);
}
```

## Signature

```typescript
function* askUserDirectoryRevokeRefreshToken(
  userDirectoryName: string,
  refreshToken: string,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `userDirectoryName` | `string` | Name of the directory — must match a directory declared with [defineUserDirectory](../../../config/core/user-directory.md). |
| `refreshToken` | `string` | The refresh token to revoke (from `AuthenticationInfo.refreshToken`). |

## Returns

`void` — the story resumes once the token has been revoked.

## Errors

| Error | Meaning |
| --- | --- |
| `UserDirectoryRevokeRefreshTokenErrorTypeEnum.Unauthorized` | The refresh token is invalid or already revoked, or revocation is disabled on the app client. |
| `UserDirectoryRevokeRefreshTokenErrorTypeEnum.LimitExceeded` | Too many attempts; back off and retry later. |

## Notes

Access tokens already minted from the revoked refresh token remain valid until they expire — they're stateless JWTs and can't be individually invalidated. Keep `accessTokenValidityMinutes` (see [defineUserDirectory](../../../config/core/user-directory.md#parameters)) short to shrink that window.

## Related

- [askUserDirectorySignOutUser](./ask-user-directory-sign-out-user.md) — revokes **every** refresh token for the user, not just one.
- [askUserDirectoryRefreshToken](./ask-user-directory-refresh-token.md) — exchanges a refresh token for fresh tokens.
- [defineUserDirectory](../../../config/core/user-directory.md) — declares the directory.
