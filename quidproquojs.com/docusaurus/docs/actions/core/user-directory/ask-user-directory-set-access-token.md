---
title: askUserDirectorySetAccessToken
description: Load an access token onto the current story session and decode it.
---

# askUserDirectorySetAccessToken

Decodes an access token issued by a [user directory](../../../config/core/user-directory.md) and stores it (and its decoded claims) on the **current story session**. Subsequent [askUserDirectoryReadAccessToken](./ask-user-directory-read-access-token.md) calls then see this identity — useful for impersonation, background work on a user's behalf, or acting as a user in a story that did not originate from an authenticated request.

- **Action type:** `UserDirectoryActionType.SetAccessToken`
- **On AWS:** verifies/decodes the token against the pool's public JWKs over HTTPS, then updates the session.

```typescript
import { askUserDirectorySetAccessToken } from '@qpqjs/core';

export function* askActAs(accessToken: string) {
  const decoded = yield* askUserDirectorySetAccessToken('app-users', accessToken);
  // From here, askUserDirectoryReadAccessToken sees this user
  return decoded.userId;
}
```

## Signature

```typescript
function* askUserDirectorySetAccessToken(
  userDirectoryName: string,
  accessToken: string,
): AskResponse<DecodedAccessToken>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `userDirectoryName` | `string` | Name of the directory that issued the token — must match a directory declared with [defineUserDirectory](../../../config/core/user-directory.md). |
| `accessToken` | `string` | The access token to load onto the session. |

## Returns

`DecodedAccessToken` — the decoded claims of the token just set. See [DecodedAccessToken](./ask-user-directory-decode-access-token.md#returns).

## Notes

- The token is stored on the session only; sessions are not transferred across service boundaries (queues, event buses, service functions), so the identity does not leak beyond the current in-process runtime.
- A token that cannot be verified (missing, malformed, wrong pool, bad signature, or expired) fails the action with a generic `Unauthorized` error and leaves the session untouched. Catch it with `askCatch` from @qpqjs/core when a failed load should not abort the story.

## Related

- [askUserDirectoryReadAccessToken](./ask-user-directory-read-access-token.md) — read the token this action sets.
- [askUserDirectoryDecodeAccessToken](./ask-user-directory-decode-access-token.md) — decode a token without touching the session.
- [askUserDirectoryAuthenticateUser](./ask-user-directory-authenticate-user.md) — obtain a token to load.
- [defineUserDirectory](../../../config/core/user-directory.md) — declares the directory.
