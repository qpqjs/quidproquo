---
title: askUserDirectoryForgotPassword
description: Start a password reset by sending the user a confirmation code.
---

# askUserDirectoryForgotPassword

Starts the self-service password-reset flow for a user in a [user directory](../../../config/core/user-directory.md). It sends the user a confirmation code (by email) and returns where the code was delivered. Complete the reset with [askUserDirectoryConfirmForgotPassword](./ask-user-directory-confirm-forgot-password.md).

- **Action type:** `UserDirectoryActionType.ForgotPassword`
- **On AWS:** issues Cognito `ForgotPassword`. The message can be customised via the [emailTemplates.resetPassword](../../../config/core/user-directory.md#email-templates) handler.

```typescript
import { askUserDirectoryForgotPassword } from '@qpqjs/core';

export function* askStartPasswordReset(username: string) {
  const delivery = yield* askUserDirectoryForgotPassword('app-users', username);
  return delivery; // e.g. { deliveryMedium: 'EMAIL', destination: 'a***@example.com', ... }
}
```

## Signature

```typescript
function* askUserDirectoryForgotPassword(
  userDirectoryName: string,
  username: string,
): AskResponse<AuthenticationDeliveryDetails>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `userDirectoryName` | `string` | Name of the directory — must match a directory declared with [defineUserDirectory](../../../config/core/user-directory.md). |
| `username` | `string` | The user (email) requesting the reset. |

## Returns

`AuthenticationDeliveryDetails` — where the confirmation code was sent:

```typescript
interface AuthenticationDeliveryDetails {
  attributeName: string;
  deliveryMedium: 'EMAIL' | 'SMS';
  destination: string;
}
```

- `attributeName` — the attribute the code was sent to (e.g. `email`).
- `deliveryMedium` — `EMAIL` or `SMS`.
- `destination` — the masked destination the code was delivered to.

## Errors

| Error | Meaning |
| --- | --- |
| `UserDirectoryForgotPasswordErrorTypeEnum.UserNotFound` | No user matches the supplied username. |
| `UserDirectoryForgotPasswordErrorTypeEnum.LimitExceeded` | Too many forgot-password attempts; back off and retry later. |

## Related

- [askUserDirectoryConfirmForgotPassword](./ask-user-directory-confirm-forgot-password.md) — finish the reset with the code and a new password.
- [askUserDirectoryChangePassword](./ask-user-directory-change-password.md) — change a password when the user knows their current one.
- [askUserDirectorySetPassword](./ask-user-directory-set-password.md) — administratively set a password without a code.
- [defineUserDirectory](../../../config/core/user-directory.md) — declares the directory and the reset email template.
