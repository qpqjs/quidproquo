---
title: askUserDirectoryGetUserAttributesByUserId
description: Read a user's profile attributes by their userId (sub).
---

# askUserDirectoryGetUserAttributesByUserId

Reads a user's profile attributes from a [user directory](../../../config/core/user-directory.md) by their `userId` (the Cognito `sub`) rather than by username. Useful when you only have the stable identifier stored on your own records.

- **Action type:** `UserDirectoryActionType.GetUserAttributesByUserId`
- **On AWS:** issues Cognito `ListUsers` filtered on the `sub` attribute.

```typescript
import { askUserDirectoryGetUserAttributesByUserId } from '@qpqjs/core';

export function* askLoadProfileById(userId: string) {
  const attributes = yield* askUserDirectoryGetUserAttributesByUserId('app-users', userId);
  return attributes;
}
```

## Signature

```typescript
function* askUserDirectoryGetUserAttributesByUserId(
  userDirectoryName: string,
  userId: string,
): AskResponse<UserAttributes>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `userDirectoryName` | `string` | Name of the directory — must match a directory declared with [defineUserDirectory](../../../config/core/user-directory.md). |
| `userId` | `string` | The user's unique identifier (the Cognito `sub`). |

## Returns

`UserAttributes` — the user's profile attributes. See [UserAttributes](./ask-user-directory-get-user-attributes.md#userattributes).

## Errors

| Error | Meaning |
| --- | --- |
| `UserDirectoryGetUserAttributesByUserIdErrorTypeEnum.UserNotFound` | No user matches the supplied userId (`sub`). |

## Related

- [askUserDirectoryGetUserAttributes](./ask-user-directory-get-user-attributes.md) — read attributes by username instead.
- [askUserDirectorySetUserAttributes](./ask-user-directory-set-user-attributes.md) — update a user's attributes.
- [askUserDirectoryDecodeAccessToken](./ask-user-directory-decode-access-token.md) — obtain the `userId` from an access token.
- [defineUserDirectory](../../../config/core/user-directory.md) — declares the directory.
