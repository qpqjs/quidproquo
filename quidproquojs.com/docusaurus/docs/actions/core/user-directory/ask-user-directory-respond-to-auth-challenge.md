---
title: askUserDirectoryRespondToAuthChallenge
description: Complete an auth challenge (new password, MFA, or custom) returned by authentication and receive tokens.
---

# askUserDirectoryRespondToAuthChallenge

Completes an authentication **challenge** raised by [askUserDirectoryAuthenticateUser](./ask-user-directory-authenticate-user.md) against a [user directory](../../../config/core/user-directory.md). You build a challenge object describing the answer (a new password, an MFA code, or a custom answer) and, on success, receive the issued tokens.

- **Action type:** `UserDirectoryActionType.RespondToAuthChallenge`
- **On AWS:** issues Cognito `RespondToAuthChallenge`. For the `MFA_SETUP` challenge the processor first calls `VerifySoftwareToken` with the TOTP code, then completes the challenge with the refreshed session.

```typescript
import { askUserDirectoryRespondToAuthChallenge, AuthenticateUserChallenge } from '@qpqjs/core';

export function* askCompleteMfa(username: string, session: string, mfaCode: string) {
  const result = yield* askUserDirectoryRespondToAuthChallenge('app-users', {
    challenge: AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA,
    username,
    session,
    mfaCode,
  });

  return result.authenticationInfo; // tokens, when the challenge succeeds
}
```

## Challenge variants

The second argument is an `AnyAuthChallenge` — a discriminated union keyed on the `challenge` field. Every variant extends `AuthChallengeBase`:

```typescript
interface AuthChallengeBase {
  challenge: AuthenticateUserChallenge;
  username: string;
  session: string;
}
```

- `username` — the user being authenticated.
- `session` — the opaque session returned by [askUserDirectoryAuthenticateUser](./ask-user-directory-authenticate-user.md) (or by an intermediate step such as [askUserDirectoryAssociateSoftwareToken](./ask-user-directory-associate-software-token.md)).

The variant you build must match the `challenge` value that authentication returned:

### `NEW_PASSWORD_REQUIRED`

```typescript
interface AuthenticateUserNewPasswordRequiredChallenge extends AuthChallengeBase {
  challenge: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED;
  newPassword: string;
}
```

Sets the account's first real password (e.g. replacing an admin-issued temporary one). `newPassword` must satisfy the pool's password policy.

### `SOFTWARE_TOKEN_MFA`

```typescript
interface AuthenticateUserSoftwareTokenMfaChallenge extends AuthChallengeBase {
  challenge: AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA;
  mfaCode: string;
}
```

Supplies the current TOTP code from the user's already-enrolled authenticator app to complete sign-in.

### `MFA_SETUP`

```typescript
interface AuthenticateUserMfaSetupChallenge extends AuthChallengeBase {
  challenge: AuthenticateUserChallenge.MFA_SETUP;
  mfaCode: string;
}
```

Completes first-time MFA enrolment. The pool requires MFA but the user has no authenticator yet: first call [askUserDirectoryAssociateSoftwareToken](./ask-user-directory-associate-software-token.md) to get the shared secret and a refreshed `session`, have the user enter the resulting code, then respond with this challenge. `mfaCode` is the first TOTP code from the freshly-associated authenticator — the processor verifies it (Cognito `VerifySoftwareToken`) before completing the challenge.

### `CUSTOM_CHALLENGE`

```typescript
interface AuthenticateUserCustomChallengeChallenge<T> extends AuthChallengeBase {
  challenge: AuthenticateUserChallenge.CUSTOM_CHALLENGE;
  challengeAnswer: T;
}
```

Answers a challenge produced by a [customAuthRuntime](../../../config/core/user-directory.md#custom-auth-runtime). `challengeAnswer` is your own payload type — it is serialised and handed to the pool's verify-auth-challenge trigger.

## Signature

```typescript
function* askUserDirectoryRespondToAuthChallenge(
  userDirectoryName: string,
  authChallenge: AnyAuthChallenge,
): AskResponse<AuthenticateUserResponse>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `userDirectoryName` | `string` | Name of the directory — must match a directory declared with [defineUserDirectory](../../../config/core/user-directory.md). |
| `authChallenge` | `AnyAuthChallenge` | The challenge answer — one of the [variants](#challenge-variants) above, matching the challenge authentication returned. |

## Returns

`AuthenticateUserResponse` — the same shape returned by [askUserDirectoryAuthenticateUser](./ask-user-directory-authenticate-user.md#returns). On a successful answer `challenge` is `NONE` and `authenticationInfo` holds the issued tokens; a further challenge may be returned if the flow requires more steps.

## Errors

| Error | Meaning |
| --- | --- |
| `UserDirectoryRespondToAuthChallengeErrorTypeEnum.InvalidCode` | The supplied MFA / challenge / TOTP code is incorrect. |
| `UserDirectoryRespondToAuthChallengeErrorTypeEnum.ExpiredCode` | The supplied code has expired; restart the challenge. |
| `UserDirectoryRespondToAuthChallengeErrorTypeEnum.InvalidNewPassword` | (`NEW_PASSWORD_REQUIRED`) the proposed password does not meet the pool's password policy. |
| `UserDirectoryRespondToAuthChallengeErrorTypeEnum.Unauthorized` | The challenge session is invalid or has expired — restart authentication. |
| `UserDirectoryRespondToAuthChallengeErrorTypeEnum.LimitExceeded` | Too many attempts; back off and retry later. |

## Related

- [askUserDirectoryAuthenticateUser](./ask-user-directory-authenticate-user.md) — raises the challenge this action answers.
- [askUserDirectoryAssociateSoftwareToken](./ask-user-directory-associate-software-token.md) — required before answering the `MFA_SETUP` challenge.
- [askUserDirectoryRefreshToken](./ask-user-directory-refresh-token.md) — refresh tokens once authentication is complete.
- [defineUserDirectory](../../../config/core/user-directory.md) — the `mfa` and `customAuthRuntime` options that produce these challenges.
