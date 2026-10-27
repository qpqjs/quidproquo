---
title: askUserDirectoryGetUserAttributes
description: Read a user's profile attributes by username.
---

# askUserDirectoryGetUserAttributes

Reads a user's profile attributes from a [user directory](../../../config/core/user-directory.md) by username (email).

- **Action type:** `UserDirectoryActionType.GetUserAttributes`
- **On AWS:** issues Cognito `AdminGetUser`.

```typescript
import { askUserDirectoryGetUserAttributes } from '@qpqjs/core';

export function* askLoadProfile(username: string) {
  const attributes = yield* askUserDirectoryGetUserAttributes('app-users', username);
  return attributes; // { email, givenName, familyName, ... }
}
```

## Signature

```typescript
function* askUserDirectoryGetUserAttributes(
  userDirectoryName: string,
  username: string,
): AskResponse<UserAttributes>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `userDirectoryName` | `string` | Name of the directory — must match a directory declared with [defineUserDirectory](../../../config/core/user-directory.md). |
| `username` | `string` | The user (email) to read. |

## Returns

`UserAttributes` — the user's profile attributes.

### `UserAttributes`

All properties are optional. This is the standard attribute set shared across the User Directory actions.

| Property | Type | Description |
| --- | --- | --- |
| `email` | `string` | The user's email address. |
| `emailVerified` | `boolean` | Whether the email address has been verified. |
| `userId` | `string` | The user's unique identifier (the Cognito `sub`). |
| `address` | `string` | The user's postal address. |
| `birthDate` | `string` | Date of birth (`YYYY-MM-DD`). |
| `familyName` | `string` | Last name / surname. |
| `gender` | `string` | Gender (e.g. `"male"`, `"female"`, `"other"`). |
| `givenName` | `string` | First name / given name. |
| `locale` | `string` | Preferred locale (e.g. `"en-US"`). |
| `middleName` | `string` | Middle name. |
| `name` | `string` | Full name. |
| `nickname` | `string` | Nickname or alias. |
| `phoneNumber` | `string` | Phone number (E.164, e.g. `"+1-555-123-4567"`). |
| `picture` | `string` | URL of the profile picture. |
| `preferredUsername` | `string` | Preferred username, if different from the given name. |
| `profile` | `string` | URL of the profile page. |
| `website` | `string` | URL of the personal website or blog. |
| `zoneInfo` | `string` | Timezone (e.g. `"America/Los_Angeles"`). |

## Errors

| Error | Meaning |
| --- | --- |
| `UserDirectoryGetUserAttributesErrorTypeEnum.UserNotFound` | No user matches the supplied username. |

## Related

- [askUserDirectoryGetUserAttributesByUserId](./ask-user-directory-get-user-attributes-by-user-id.md) — read attributes by userId (`sub`) instead of username.
- [askUserDirectorySetUserAttributes](./ask-user-directory-set-user-attributes.md) — update these attributes.
- [askUserDirectoryGetUsers](./ask-user-directory-get-users.md) / [askUserDirectoryGetUsersByAttribute](./ask-user-directory-get-users-by-attribute.md) — list users.
- [defineUserDirectory](../../../config/core/user-directory.md) — declares the directory.
