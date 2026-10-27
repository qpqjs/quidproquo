---
title: askUserDirectorySetUserAttributes
description: Update a user's profile attributes.
---

# askUserDirectorySetUserAttributes

Updates a user's profile attributes in a [user directory](../../../config/core/user-directory.md). Only the attributes you pass are written; omitted attributes are left unchanged.

- **Action type:** `UserDirectoryActionType.SetUserAttributes`
- **On AWS:** issues Cognito `AdminUpdateUserAttributes`.

```typescript
import { askUserDirectorySetUserAttributes } from '@qpqjs/core';

export function* askUpdateProfile(username: string) {
  yield* askUserDirectorySetUserAttributes('app-users', username, {
    givenName: 'Ada',
    familyName: 'Lovelace',
    locale: 'en-GB',
  });
}
```

## Signature

```typescript
function* askUserDirectorySetUserAttributes(
  userDirectoryName: string,
  username: string,
  userAttributes: UserAttributes,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `userDirectoryName` | `string` | Name of the directory — must match a directory declared with [defineUserDirectory](../../../config/core/user-directory.md). |
| `username` | `string` | The user (email) to update. |
| `userAttributes` | `UserAttributes` | The attributes to set. See [UserAttributes](./ask-user-directory-get-user-attributes.md#userattributes). All properties are optional; only those provided are written. |

## Returns

`void` — the story resumes once the attributes have been updated.

## Errors

| Error | Meaning |
| --- | --- |
| `UserDirectorySetUserAttributesErrorTypeEnum.UserNotFound` | No user matches the supplied username. |
| `UserDirectorySetUserAttributesErrorTypeEnum.InvalidAttributes` | One or more supplied attribute names/values are invalid. |
| `UserDirectorySetUserAttributesErrorTypeEnum.AliasExists` | An email/phone attribute value is already in use by another account. |
| `UserDirectorySetUserAttributesErrorTypeEnum.LimitExceeded` | Too many attempts; back off and retry later. |

## Related

- [askUserDirectoryGetUserAttributes](./ask-user-directory-get-user-attributes.md) — read the attributes you are updating.
- [askUserDirectoryCreateUser](./ask-user-directory-create-user.md) — set initial attributes at creation time.
- [defineUserDirectory](../../../config/core/user-directory.md) — declares the directory.
