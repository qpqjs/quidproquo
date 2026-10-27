---
title: askUserDirectoryConfirmForgotPassword
description: Complete a password reset with the confirmation code and a new password.
---

# askUserDirectoryConfirmForgotPassword

Completes the password-reset flow started by [askUserDirectoryForgotPassword](./ask-user-directory-forgot-password.md): the user supplies the confirmation code they received and their chosen new password.

- **Action type:** `UserDirectoryActionType.ConfirmForgotPassword`
- **On AWS:** issues Cognito `ConfirmForgotPassword`.

```typescript
import { askUserDirectoryConfirmForgotPassword } from '@qpqjs/core';

export function* askFinishPasswordReset(code: string, username: string, newPassword: string) {
  yield* askUserDirectoryConfirmForgotPassword('app-users', code, username, newPassword);
}
```

## Signature

```typescript
function* askUserDirectoryConfirmForgotPassword(
  userDirectoryName: string,
  code: string,
  username: string,
  password: string,
): AskResponse<AuthenticateUserResponse>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `userDirectoryName` | `string` | Name of the directory — must match a directory declared with [defineUserDirectory](../../../config/core/user-directory.md). |
| `code` | `string` | The confirmation code delivered by [askUserDirectoryForgotPassword](./ask-user-directory-forgot-password.md). |
| `username` | `string` | The user (email) resetting their password. |
| `password` | `string` | The new password; must satisfy the pool's password policy. |

## Returns

`AuthenticateUserResponse` — the same shape returned by [askUserDirectoryAuthenticateUser](./ask-user-directory-authenticate-user.md#returns).

## Errors

| Error | Meaning |
| --- | --- |
| `UserDirectoryConfirmForgotPasswordErrorTypeEnum.InvalidCode` | The supplied confirmation code does not match. |
| `UserDirectoryConfirmForgotPasswordErrorTypeEnum.ExpiredCode` | The confirmation code has expired; request a new one. |
| `UserDirectoryConfirmForgotPasswordErrorTypeEnum.InvalidNewPassword` | The proposed new password does not meet the pool's password policy. |
| `UserDirectoryConfirmForgotPasswordErrorTypeEnum.LimitExceeded` | Too many attempts; back off and retry later. |

## Related

- [askUserDirectoryForgotPassword](./ask-user-directory-forgot-password.md) — starts the reset and sends the code.
- [askUserDirectoryChangePassword](./ask-user-directory-change-password.md) — change a password when the current one is known.
- [defineUserDirectory](../../../config/core/user-directory.md) — declares the directory and its password policy.
