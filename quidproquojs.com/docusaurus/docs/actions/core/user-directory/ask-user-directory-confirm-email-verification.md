---
title: askUserDirectoryConfirmEmailVerification
description: Confirm a user's email address with the verification code they received.
---

# askUserDirectoryConfirmEmailVerification

Confirms a signed-in user's email address using the code sent by [askUserDirectoryRequestEmailVerification](./ask-user-directory-request-email-verification.md), marking the email as verified.

- **Action type:** `UserDirectoryActionType.ConfirmEmailVerification`
- **On AWS:** issues Cognito `VerifyUserAttribute` for the `email` attribute using the supplied access token.

```typescript
import { askUserDirectoryConfirmEmailVerification } from '@qpqjs/core';

export function* askFinishEmailVerification(code: string, accessToken: string) {
  yield* askUserDirectoryConfirmEmailVerification(code, accessToken);
}
```

## Signature

```typescript
function* askUserDirectoryConfirmEmailVerification(
  code: string,
  accessToken: string,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `code` | `string` | The verification code delivered by [askUserDirectoryRequestEmailVerification](./ask-user-directory-request-email-verification.md). |
| `accessToken` | `string` | The signed-in user's access token, identifying whose email to verify. |

## Returns

`void` — the story resumes once the email has been verified.

## Errors

| Error | Meaning |
| --- | --- |
| `UserDirectoryConfirmEmailVerificationErrorTypeEnum.InvalidCode` | The supplied verification code does not match. |
| `UserDirectoryConfirmEmailVerificationErrorTypeEnum.ExpiredCode` | The verification code has expired; request a new one. |
| `UserDirectoryConfirmEmailVerificationErrorTypeEnum.LimitExceeded` | Too many verification attempts; back off and retry later. |

## Related

- [askUserDirectoryRequestEmailVerification](./ask-user-directory-request-email-verification.md) — sends the code this action confirms.
- [defineUserDirectory](../../../config/core/user-directory.md) — declares the directory.
