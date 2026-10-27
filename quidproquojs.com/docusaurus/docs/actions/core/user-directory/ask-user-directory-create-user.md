---
title: askUserDirectoryCreateUser
description: Administratively create a user account in a user directory.
---

# askUserDirectoryCreateUser

Creates a user account in a [user directory](../../../config/core/user-directory.md) with an email, a password, and any additional profile attributes. This is the administrative create path — use it when `selfSignUpEnabled` is off, or whenever your service provisions accounts itself.

- **Action type:** `UserDirectoryActionType.CreateUser`
- **On AWS:** issues Cognito `AdminCreateUser` against the pool.

```typescript
import { askUserDirectoryCreateUser } from '@qpqjs/core';

export function* askInviteUser(email: string, temporaryPassword: string) {
  yield* askUserDirectoryCreateUser('app-users', {
    email,
    emailVerified: true,
    password: temporaryPassword,
    givenName: 'New',
    familyName: 'User',
  });
}
```

## Signature

```typescript
function* askUserDirectoryCreateUser(
  userDirectoryName: string,
  createUserRequest: CreateUserRequest,
): AskResponse<AuthenticateUserResponse>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `userDirectoryName` | `string` | Name of the directory to create the user in — must match a directory declared with [defineUserDirectory](../../../config/core/user-directory.md). |
| `createUserRequest` | `CreateUserRequest` | The new user's details — see below. |

### `CreateUserRequest`

Extends `UserAttributes` (minus `userId`) with the required fields for creation:

| Property | Type | Description |
| --- | --- | --- |
| `email` | `string` | The user's email address (also the username). Required. |
| `emailVerified` | `boolean` | Whether to mark the email as already verified. Required. |
| `password` | `string` | The initial password; must satisfy the pool's password policy. Required. |
| *(other attributes)* | `UserAttributes` | Any other standard profile attributes (`givenName`, `familyName`, `phoneNumber`, `locale`, …) may be supplied. See [UserAttributes](./ask-user-directory-get-user-attributes.md#userattributes). |

## Returns

`AuthenticateUserResponse` — the same shape returned by [askUserDirectoryAuthenticateUser](./ask-user-directory-authenticate-user.md#returns).

## Errors

| Error | Meaning |
| --- | --- |
| `UserDirectoryCreateUserErrorTypeEnum.Conflict` | An account with this email already exists. |
| `UserDirectoryCreateUserErrorTypeEnum.InvalidPassword` | The supplied password does not meet the pool's password policy. |
| `UserDirectoryCreateUserErrorTypeEnum.LimitExceeded` | Too many create-user attempts; back off and retry later. |

## Related

- [defineUserDirectory](../../../config/core/user-directory.md) — declares the directory this action creates users in.
- [askUserDirectoryAuthenticateUser](./ask-user-directory-authenticate-user.md) — sign the new user in.
- [askUserDirectorySetUserAttributes](./ask-user-directory-set-user-attributes.md) — update profile attributes after creation.
- [askUserDirectorySetPassword](./ask-user-directory-set-password.md) — administratively (re)set a user's password.
- [askUserDirectoryGetUsers](./ask-user-directory-get-users.md) — list the accounts in the directory.
