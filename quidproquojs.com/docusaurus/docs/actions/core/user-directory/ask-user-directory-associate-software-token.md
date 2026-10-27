---
title: askUserDirectoryAssociateSoftwareToken
description: Begin TOTP MFA enrolment — get the authenticator secret and a refreshed session.
---

# askUserDirectoryAssociateSoftwareToken

Starts first-time TOTP (authenticator-app) MFA enrolment for a user against a [user directory](../../../config/core/user-directory.md). It returns the shared secret to display to the user (as text or a QR code) and a refreshed session to carry into the challenge response.

- **Action type:** `UserDirectoryActionType.AssociateSoftwareToken`
- **On AWS:** issues Cognito `AssociateSoftwareToken`.

```typescript
import {
  askUserDirectoryAssociateSoftwareToken,
  askUserDirectoryRespondToAuthChallenge,
  AuthenticateUserChallenge,
} from '@qpqjs/core';

export function* askEnrolMfa(username: string, session: string, mfaCode: string) {
  // 1. Get the secret + a fresh session (show secretCode to the user as a QR code)
  const { secretCode, session: mfaSession } =
    yield* askUserDirectoryAssociateSoftwareToken('app-users', session);

  // 2. The user scans secretCode and enters the first code; complete MFA_SETUP
  return yield* askUserDirectoryRespondToAuthChallenge('app-users', {
    challenge: AuthenticateUserChallenge.MFA_SETUP,
    username,
    session: mfaSession,
    mfaCode,
  });
}
```

## When to use it

When [askUserDirectoryAuthenticateUser](./ask-user-directory-authenticate-user.md) returns the `MFA_SETUP` challenge — the pool requires MFA but the user has not enrolled an authenticator yet. Call this action with the challenge's `session`, present `secretCode` to the user, then complete the `MFA_SETUP` variant of [askUserDirectoryRespondToAuthChallenge](./ask-user-directory-respond-to-auth-challenge.md#mfa_setup) with the first code from their authenticator.

## Signature

```typescript
function* askUserDirectoryAssociateSoftwareToken(
  userDirectoryName: string,
  session: string,
): AskResponse<AssociateSoftwareTokenResult>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `userDirectoryName` | `string` | Name of the directory — must match a directory declared with [defineUserDirectory](../../../config/core/user-directory.md). |
| `session` | `string` | The session from the `MFA_SETUP` challenge returned by authentication. |

## Returns

`AssociateSoftwareTokenResult`:

```typescript
interface AssociateSoftwareTokenResult {
  secretCode: string;
  session: string;
}
```

- `secretCode` — the Base32 secret used to seed the authenticator app (and to build the `otpauth://` URI / QR code shown to the user).
- `session` — a refreshed session to carry into the [MFA_SETUP challenge response](./ask-user-directory-respond-to-auth-challenge.md#mfa_setup).

## Related

- [askUserDirectoryRespondToAuthChallenge](./ask-user-directory-respond-to-auth-challenge.md) — complete the `MFA_SETUP` challenge with the secret you associate here.
- [askUserDirectoryAuthenticateUser](./ask-user-directory-authenticate-user.md) — raises the `MFA_SETUP` challenge.
- [defineUserDirectory](../../../config/core/user-directory.md) — the `mfa` option that enables TOTP enrolment.
