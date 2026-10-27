---
title: askUserDirectorySignOutUser
description: Globally sign a user out by revoking every refresh token issued to them.
---

# askUserDirectorySignOutUser

Globally signs a user out: revokes **every** refresh token issued to the owner of the supplied access token, against a [user directory](../../../config/core/user-directory.md). Use this for a "sign out of all devices" action or as a compromise response, since a stolen/persisted refresh token stops working for every session at once.

- **Action type:** `UserDirectoryActionType.SignOutUser`
- **On AWS:** issues Cognito `GlobalSignOut`. Authorized by the access token itself — no user directory name or IAM is needed to identify the user, Cognito resolves it from the token.

```typescript
import { askUserDirectorySignOutUser } from '@qpqjs/core';

export function* askLogOutEverywhere(accessToken: string) {
  yield* askUserDirectorySignOutUser(accessToken);
}
```

## Signature

```typescript
function* askUserDirectorySignOutUser(accessToken: string): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `accessToken` | `string` | The signed-in user's access token, identifying whose sessions to sign out. |

## Returns

`void` — the story resumes once every session has been revoked.

## Errors

| Error | Meaning |
| --- | --- |
| `UserDirectorySignOutUserErrorTypeEnum.Unauthorized` | The access token is missing, invalid, or expired — there is nothing to revoke. |
| `UserDirectorySignOutUserErrorTypeEnum.LimitExceeded` | Too many attempts; back off and retry later. |

## Notes

Access tokens already minted remain valid until they expire — they're stateless JWTs and can't be individually invalidated. Keep `accessTokenValidityMinutes` (see [defineUserDirectory](../../../config/core/user-directory.md#parameters)) short to shrink that window.

## Related

- [askUserDirectoryRevokeRefreshToken](./ask-user-directory-revoke-refresh-token.md) — revokes only a single session, leaving the user's other devices signed in.
- [askUserDirectoryReadAccessToken](./ask-user-directory-read-access-token.md) / [askUserDirectoryDecodeAccessToken](./ask-user-directory-decode-access-token.md) — inspect an access token.
- [defineUserDirectory](../../../config/core/user-directory.md) — declares the directory.
