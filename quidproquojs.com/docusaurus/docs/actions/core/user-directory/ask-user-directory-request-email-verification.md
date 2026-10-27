---
title: askUserDirectoryRequestEmailVerification
description: Send a signed-in user a code to verify their email address.
---

# askUserDirectoryRequestEmailVerification

Sends a signed-in user a verification code for their email address in a [user directory](../../../config/core/user-directory.md), and reports where it was delivered. Complete the verification with [askUserDirectoryConfirmEmailVerification](./ask-user-directory-confirm-email-verification.md).

- **Action type:** `UserDirectoryActionType.RequestEmailVerification`
- **On AWS:** issues Cognito `GetUserAttributeVerificationCode` for the `email` attribute using the supplied access token. The message can be customised via the [emailTemplates.verifyEmail](../../../config/core/user-directory.md#email-templates) handler.

```typescript
import { askUserDirectoryRequestEmailVerification } from '@qpqjs/core';

export function* askStartEmailVerification(accessToken: string) {
  const delivery = yield* askUserDirectoryRequestEmailVerification('app-users', accessToken);
  return delivery; // where the code was sent
}
```

## Signature

```typescript
function* askUserDirectoryRequestEmailVerification(
  userDirectoryName: string,
  accessToken: string,
): AskResponse<AuthenticationDeliveryDetails>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `userDirectoryName` | `string` | Name of the directory — must match a directory declared with [defineUserDirectory](../../../config/core/user-directory.md). |
| `accessToken` | `string` | The signed-in user's access token, identifying whose email to verify. |

## Returns

`AuthenticationDeliveryDetails` — where the verification code was delivered (`attributeName`, `deliveryMedium`, `destination`). See [AuthenticationDeliveryDetails](./ask-user-directory-forgot-password.md#returns).

## Errors

| Error | Meaning |
| --- | --- |
| `UserDirectoryRequestEmailVerificationErrorTypeEnum.Unauthorized` | The access token is missing/invalid — the caller must re-authenticate. |
| `UserDirectoryRequestEmailVerificationErrorTypeEnum.LimitExceeded` | Too many verification-code requests; back off and retry later. |
| `UserDirectoryRequestEmailVerificationErrorTypeEnum.CodeDeliveryFailed` | The verification code could not be delivered to the user. |

## Related

- [askUserDirectoryConfirmEmailVerification](./ask-user-directory-confirm-email-verification.md) — finish verification with the code.
- [defineUserDirectory](../../../config/core/user-directory.md) — declares the directory and the verification email template.
