---
title: askUserDirectoryReadAccessToken
description: Read and decode the access token on the current story session.
---

# askUserDirectoryReadAccessToken

Reads the access token attached to the **current story session** and returns its decoded claims. On an authenticated API request the runtime puts the caller's token on the session, so this is the usual way a story learns who is making the request — no token argument needed.

- **Action type:** `UserDirectoryActionType.ReadAccessToken`
- **On AWS:** returns the session's already-decoded token when present; otherwise verifies the session's token against the pool's public JWKs over HTTPS (no Cognito API call).

```typescript
import { askUserDirectoryReadAccessToken } from '@qpqjs/core';

export function* askCurrentUserId() {
  const token = yield* askUserDirectoryReadAccessToken('app-users', false);
  return token.userId;
}
```

## Signature

```typescript
function* askUserDirectoryReadAccessToken(
  userDirectoryName: string,
  ignoreExpiration: boolean,
): AskResponse<DecodedAccessToken>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `userDirectoryName` | `string` | Name of the directory the session's token belongs to — must match a directory declared with [defineUserDirectory](../../../config/core/user-directory.md). |
| `ignoreExpiration` | `boolean` | When `true`, an expired token is still returned rather than rejected. |

## Returns

`DecodedAccessToken` — the decoded claims of the session's access token. See [DecodedAccessToken](./ask-user-directory-decode-access-token.md#returns).

## Notes

- This reads the token from the ambient session; there is no `accessToken` parameter. To decode a token you hold yourself, use [askUserDirectoryDecodeAccessToken](./ask-user-directory-decode-access-token.md).
- If the session carries no token, or the token is invalid/expired (and `ignoreExpiration` is `false`), the action fails — catch it with `askCatch` from @qpqjs/core.

## Related

- [askUserDirectorySetAccessToken](./ask-user-directory-set-access-token.md) — put a token onto the session for this action to read.
- [askUserDirectoryDecodeAccessToken](./ask-user-directory-decode-access-token.md) — decode an arbitrary token passed as an argument.
- [defineUserDirectory](../../../config/core/user-directory.md) — declares the directory.
- [askEventDocResolveActor](../../features/event-doc/ask-event-doc-resolve-actor.md) — resolves the event-doc acting user from the token this reads.
