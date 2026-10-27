---
title: askUserDirectoryAuthenticateUser
description: Sign a user in against a user directory, returning tokens or an auth challenge to complete.
---

# askUserDirectoryAuthenticateUser

Signs a user in against a [user directory](../../../config/core/user-directory.md). On success it returns either the issued tokens or an **auth challenge** the caller must complete (new password, MFA, or a custom challenge) before tokens are issued.

- **Action type:** `UserDirectoryActionType.AuthenticateUser`
- **On AWS:** issues Cognito `AdminInitiateAuth` — `ADMIN_USER_PASSWORD_AUTH` for a normal sign-in, or `CUSTOM_AUTH` when `isCustom` is `true` (requires a [customAuthRuntime](../../../config/core/user-directory.md#custom-auth-runtime)).

```typescript
import { askUserDirectoryAuthenticateUser, AuthenticateUserChallenge } from '@qpqjs/core';

export function* askSignIn(email: string, password: string) {
  const result = yield* askUserDirectoryAuthenticateUser('app-users', false, email, password);

  if (result.challenge === AuthenticateUserChallenge.NONE) {
    return result.authenticationInfo; // signed in — tokens are ready
  }

  // A challenge must be answered first — see askUserDirectoryRespondToAuthChallenge
  return result;
}
```

## The auth flow

Authentication is a two-step handshake:

1. **Authenticate** with `askUserDirectoryAuthenticateUser`. The response's `challenge` field says what happens next.
2. If `challenge` is `NONE`, `authenticationInfo` holds the tokens and you are done. Otherwise the response carries a `session` (and `challengeParameters`) that you pass into [askUserDirectoryRespondToAuthChallenge](./ask-user-directory-respond-to-auth-challenge.md) to complete the challenge and obtain tokens.

### `AuthenticateUserChallenge`

The `challenge` field is one of:

| Value | Meaning | Next step |
| --- | --- | --- |
| `NONE` | No challenge — sign-in is complete and `authenticationInfo` is populated. | Done. |
| `NEW_PASSWORD_REQUIRED` | The user must set a new password (e.g. an admin-created account with a temporary password). | Respond with the `NEW_PASSWORD_REQUIRED` challenge. |
| `SOFTWARE_TOKEN_MFA` | The user is enrolled in TOTP MFA and must supply a current authenticator code. | Respond with the `SOFTWARE_TOKEN_MFA` challenge. |
| `MFA_SETUP` | The pool requires MFA but the user has no authenticator enrolled yet. | [Associate a software token](./ask-user-directory-associate-software-token.md), then respond with the `MFA_SETUP` challenge. |
| `CUSTOM_CHALLENGE` | A custom auth flow is presenting a challenge. | Respond with the `CUSTOM_CHALLENGE` challenge. |
| `RESET_PASSWORD` | The user must reset their password out of band. | Use [forgot password](./ask-user-directory-forgot-password.md). |

The concrete challenge payloads you build in response are documented on [askUserDirectoryRespondToAuthChallenge](./ask-user-directory-respond-to-auth-challenge.md).

## Signature

```typescript
function* askUserDirectoryAuthenticateUser(
  userDirectoryName: string,
  isCustom: boolean,
  email: string,
  password?: string,
): AskResponse<AuthenticateUserResponse>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `userDirectoryName` | `string` | Name of the directory to authenticate against — must match a directory declared with [defineUserDirectory](../../../config/core/user-directory.md) (or one shared via its `owner` option). |
| `isCustom` | `boolean` | `false` for a standard email + password sign-in; `true` to start Cognito's custom auth flow (requires a [customAuthRuntime](../../../config/core/user-directory.md#custom-auth-runtime)). When `true`, `password` is not used. |
| `email` | `string` | The user's email / username. |
| `password` | `string` | The user's password. Required for a standard (`isCustom: false`) sign-in: a missing or empty password throws `InvalidPassword`. Omitted for custom auth. |

## Returns

`AuthenticateUserResponse`:

```typescript
interface AuthenticateUserResponse {
  challenge: AuthenticateUserChallenge;
  challengeParameters?: Record<string, string>;
  session?: string;
  authenticationInfo?: AuthenticationInfo;
}

interface AuthenticationInfo {
  accessToken?: string;
  expirationDurationInSeconds?: number;
  expiresAt?: QpqIsoDateTime;
  idToken?: string;
  refreshToken?: string;
  tokenType?: string;
}
```

- `challenge` — which [challenge](#authenticateuserchallenge), if any, must be answered next.
- `challengeParameters` — extra parameters from the provider describing the pending challenge.
- `session` — an opaque session token to carry into [askUserDirectoryRespondToAuthChallenge](./ask-user-directory-respond-to-auth-challenge.md) (present when a challenge is pending).
- `authenticationInfo` — the issued tokens (access, id, refresh) plus expiry, present when `challenge` is `NONE`.

## Errors

| Error | Meaning |
| --- | --- |
| `UserDirectoryAuthenticateUserErrorTypeEnum.UserNotFound` | The email or password is incorrect. Unknown users and wrong passwords are deliberately reported the same way so callers cannot probe which accounts exist. |
| `UserDirectoryAuthenticateUserErrorTypeEnum.InvalidPassword` | A standard (`isCustom: false`) sign-in was attempted without a password. Thrown before the request reaches the identity provider. |

Errors thrown by actions can be caught with `askCatch` from @qpqjs/core. It returns an `EitherActionResult` — `{ success: true, result }` on success, or `{ success: false, error }` on failure:

```typescript
const outcome = yield* askCatch(askUserDirectoryAuthenticateUser('app-users', false, email, password));

if (outcome.success) {
  const result = outcome.result;
  // ...
} else {
  // outcome.error.errorType / outcome.error.errorText
}
```

## Related

- [defineUserDirectory](../../../config/core/user-directory.md) — declares the directory this action authenticates against.
- [askUserDirectoryRespondToAuthChallenge](./ask-user-directory-respond-to-auth-challenge.md) — answer the challenge this action can return.
- [askUserDirectoryRefreshToken](./ask-user-directory-refresh-token.md) — exchange a refresh token for fresh access tokens later.
- [askUserDirectoryAssociateSoftwareToken](./ask-user-directory-associate-software-token.md) — enrol an authenticator when the `MFA_SETUP` challenge is returned.
- [askUserDirectoryCreateUser](./ask-user-directory-create-user.md) — create the accounts you authenticate here.
- [askUserDirectorySetAccessToken](./ask-user-directory-set-access-token.md) — load the returned access token into the current story session.
