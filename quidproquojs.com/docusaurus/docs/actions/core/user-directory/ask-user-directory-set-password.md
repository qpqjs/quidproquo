---
title: askUserDirectorySetPassword
description: Administratively set a user's password without a confirmation code.
---

# askUserDirectorySetPassword

Administratively sets a user's password in a [user directory](../../../config/core/user-directory.md), no current password or confirmation code required. Use it for support-driven resets or programmatic provisioning; it is a privileged operation and should never be exposed directly to end users.

- **Action type:** `UserDirectoryActionType.SetPassword`
- **On AWS:** issues Cognito `AdminSetUserPassword` (setting the password as permanent).

```typescript
import { askUserDirectorySetPassword } from '@qpqjs/core';

export function* askResetUserPassword(username: string, newPassword: string) {
  yield* askUserDirectorySetPassword('app-users', username, newPassword);
}
```

## Signature

```typescript
function* askUserDirectorySetPassword(
  userDirectoryName: string,
  username: string,
  newPassword: string,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `userDirectoryName` | `string` | Name of the directory — must match a directory declared with [defineUserDirectory](../../../config/core/user-directory.md). |
| `username` | `string` | The user (email) whose password to set. |
| `newPassword` | `string` | The new password; must satisfy the pool's password policy. |

## Returns

`void` — the story resumes once the password has been set.

## Errors

| Error | Meaning |
| --- | --- |
| `UserDirectorySetPasswordErrorTypeEnum.UserNotFound` | No user matches the supplied username. |
| `UserDirectorySetPasswordErrorTypeEnum.InvalidNewPassword` | The supplied password does not meet the pool's password policy. |
| `UserDirectorySetPasswordErrorTypeEnum.LimitExceeded` | Too many attempts; back off and retry later. |

## Related

- [askUserDirectoryChangePassword](./ask-user-directory-change-password.md) — self-service change using the current password.
- [askUserDirectoryForgotPassword](./ask-user-directory-forgot-password.md) / [askUserDirectoryConfirmForgotPassword](./ask-user-directory-confirm-forgot-password.md) — user-driven reset with a code.
- [defineUserDirectory](../../../config/core/user-directory.md) — declares the directory and its password policy.
