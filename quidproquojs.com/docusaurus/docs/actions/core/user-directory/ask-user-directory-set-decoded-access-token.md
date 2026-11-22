---
title: askUserDirectorySetDecodedAccessToken
description: Make an identity the caller has already verified the current story session's user.
---

# askUserDirectorySetDecodedAccessToken

Stores a `DecodedAccessToken` on the **current story session** as it is, with no token behind it and nothing checked. It is for a principal that no [user directory](../../../config/core/user-directory.md) can decode: one a service authenticates itself, such as a guest holding a session token the service issued. Subsequent [askUserDirectoryReadAccessToken](./ask-user-directory-read-access-token.md) calls then see this identity, whichever directory name they pass.

- **Action type:** `UserDirectoryActionType.SetDecodedAccessToken`
- **On every server runtime:** updates the session. It is not available in the browser. No network call, and no user directory is read.

```typescript
import { askUserDirectorySetDecodedAccessToken } from '@qpqjs/core';

export function* askActAsGuest(guestId: string, displayName: string, expiresAtSeconds: number) {
  yield* askUserDirectorySetDecodedAccessToken({
    userId: `guest:${guestId}`,
    username: displayName,
    exp: expiresAtSeconds,
    userDirectory: '',
    wasValid: true,
  });
  // From here, askUserDirectoryReadAccessToken sees this guest
}
```

## Signature

```typescript
function* askUserDirectorySetDecodedAccessToken(
  decodedAccessToken: DecodedAccessToken,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `decodedAccessToken` | `DecodedAccessToken` | The identity to put on the session. See [DecodedAccessToken](./ask-user-directory-decode-access-token.md#returns). |

## Returns

Nothing.

## Notes

- **The caller vouches for every field.** Nothing verifies the identity, so only call this after your own code has. Set `wasValid: true` only for an identity you have verified: a read refuses a decoded token whose `wasValid` is false.
- `exp` is a Unix timestamp in seconds. A read refuses the identity once it has passed, unless it asks to ignore expiry.
- The session's raw `accessToken` is left as it is. Only the decoded identity changes.
- Unlike the raw access token, the decoded identity does travel with the session across queues, event buses and service functions, so handlers downstream see the same user.
- A websocket queue with a `connectionAuthenticator` calls this for you when the authenticator's result names a `sessionUser`. See [defineWebSocketQueue](../../../config/features/web-socket-queue.md).

## Related

- [askUserDirectorySetAccessToken](./ask-user-directory-set-access-token.md): the same for a token a user directory issued, which it verifies first.
- [askUserDirectoryReadAccessToken](./ask-user-directory-read-access-token.md): read the identity this action sets.
- [defineWebSocketQueue](../../../config/features/web-socket-queue.md): the `connectionAuthenticator` option.
