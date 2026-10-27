---
title: askUserDirectoryChangePassword
description: Let a signed-in user change their own password using their current password.
---

# askUserDirectoryChangePassword

Changes a signed-in user's password. The caller proves ownership with the user's current password and a valid access token — this is the self-service "change my password" path (not an admin reset).

- **Action type:** `UserDirectoryActionType.ChangePassword`
- **On AWS:** issues Cognito `ChangePassword` using the supplied access token.

```typescript
import { askUserDirectoryChangePassword } from '@qpqjs/core';

export function* askUpdateMyPassword(oldPassword: string, newPassword: string, accessToken: string) {
  yield* askUserDirectoryChangePassword(oldPassword, newPassword, accessToken);
}
```

## Signature

```typescript
function* askUserDirectoryChangePassword(
  oldPassword: string,
  newPassword: string,
  accessToken: string,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `oldPassword` | `string` | The user's current password. |
| `newPassword` | `string` | The new password; must satisfy the pool's password policy. |
| `accessToken` | `string` | The signed-in user's access token, identifying whose password to change. |

## Returns

`void` — the story resumes once the password has been changed.

## Errors

| Error | Meaning |
| --- | --- |
| `UserDirectoryChangePasswordErrorTypeEnum.IncorrectPassword` | The supplied current password was wrong (or the access token was invalid). |
| `UserDirectoryChangePasswordErrorTypeEnum.InvalidNewPassword` | The proposed new password does not meet the pool's password policy. |
| `UserDirectoryChangePasswordErrorTypeEnum.LimitExceeded` | Too many password-change attempts; back off and retry later. |

## Related

- [askUserDirectoryForgotPassword](./ask-user-directory-forgot-password.md) / [askUserDirectoryConfirmForgotPassword](./ask-user-directory-confirm-forgot-password.md) — reset a password the user has forgotten.
- [askUserDirectorySetPassword](./ask-user-directory-set-password.md) — administratively set a user's password.
- [defineUserDirectory](../../../config/core/user-directory.md) — declares the directory and its password policy.
