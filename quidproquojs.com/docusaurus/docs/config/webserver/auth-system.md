---
title: defineAuthSystem
description: Bundle a complete username/password login flow — a user directory plus the HTTP routes to log in, refresh tokens, respond to challenges, and recover passwords.
---

# defineAuthSystem

Bundles a complete username/password **authentication system** into a single config entry: it declares a [user directory](../../config/core/user-directory.md) and wires up all the HTTP endpoints needed to log in, refresh access tokens, respond to auth challenges (including MFA / software-token association), recover a forgotten password, and change a password. The handler stories ship inside @qpqjs/webserver — you don't write them — so a single `defineAuthSystem(...)` call gives a service a working auth API.

`defineAuthSystem` is a convenience that expands into several lower-level config settings; understanding those makes its behaviour clear. It emits:

1. A top-level [`defineUserDirectory`](../../config/core/user-directory.md) (ungated, so other services can reference it to validate access tokens), owned by the given service.
2. A `defineServiceSettings` block (gated to the owning service) containing a global that records the directory name, plus one route per auth endpoint.

- **On AWS:** deploys whatever the emitted settings deploy — a Cognito user pool + app client for the user directory (see [defineUserDirectory](../../config/core/user-directory.md)) and API Gateway routes/Lambdas for each endpoint. `defineAuthSystem` itself provisions no infrastructure beyond what those settings do.

```typescript
import { defineAuthSystem } from '@qpqjs/webserver';

export default [
  defineAuthSystem('auth', 'app-users', {
    selfSignUpEnabled: true,
    basePath: '/auth',
  }),
];
```

## Signature

```typescript
function defineAuthSystem(
  service: string,
  directoryName: string,
  options?: AuthSystemOptions,
): QPQConfig;
```

Note the return type is `QPQConfig` (an array of config settings), not a single setting — spread it into, or include it in, your config array.

## Parameters

### `service` — `string` (required)

The service/module that owns the auth system. The user directory is declared with `owner: { module: service }`, and the login endpoints are placed inside a `defineServiceSettings` block keyed on this service, so they only deploy with that service.

### `directoryName` — `string` (required)

The name of the [user directory](../../config/core/user-directory.md) to create and authenticate against. This is the same name you pass as `userDirectoryName` to the [User Directory actions](../../actions/core/user-directory/ask-user-directory-authenticate-user.md), and it is recorded in a global (`qpq-auth-user-directory`) so the built-in auth handler stories can resolve it at runtime. The `/changePassword` route is configured with `routeAuthSettings.userDirectoryName = directoryName`, so it requires a valid access token from this directory.

### `options` — `AuthSystemOptions` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `phoneRequired` | `boolean` | `false` | Forwarded to the user directory: makes `phoneNumber` a required, auto-verified attribute. See [defineUserDirectory](../../config/core/user-directory.md#parameters). |
| `selfSignUpEnabled` | `boolean` | `false` | Forwarded to the user directory: allows users to sign themselves up. See [defineUserDirectory](../../config/core/user-directory.md#parameters). |
| `emailTemplates` | `EmailTemplates` | – | Forwarded to the user directory: story functions that customise the verification / password-reset emails. See [Email templates](../../config/core/user-directory.md#email-templates). |
| `mfa` | `UserDirectoryMfaSettings` | – | Forwarded to the user directory: multi-factor authentication configuration. See [MFA](../../config/core/user-directory.md#mfa). |
| `basePath` | `string` | `''` | A path prefix applied to every auth route. E.g. `'/auth'` produces `/auth/login`, `/auth/refreshToken`, and so on. |
| `allowedOrigins` | `string[]` | – | Allowed browser origins (CORS) applied to every generated auth route. |
| `accessTokenValidityMinutes` | `number` | `60` (Cognito default) | Forwarded to the user directory: access/ID token (JWT) lifetime in minutes (Cognito allows 5–1440). Shorter shrinks the window in which a revoked session's access token keeps working. Keep it comfortably above however long the client waits before refreshing (the stock web client refreshes ~10 minutes before expiry). See [defineUserDirectory](../../config/core/user-directory.md#parameters). |

## Generated routes

With `basePath` = `''` (the default), `defineAuthSystem` registers these `POST` routes, each handled by a built-in `authController` story:

| Path | Handler | Auth required |
| --- | --- | --- |
| `/login` | `login` | No |
| `/refreshToken` | `refreshToken` | No |
| `/logout` | `logout` | No |
| `/logoutEverywhere` | `logoutEverywhere` | No |
| `/challenge` | `respondToAuthChallenge` | No |
| `/associateSoftwareToken` | `associateSoftwareToken` | No |
| `/forgotPassword` | `forgotPassword` | No |
| `/forgotPassword/confirm` | `confirmForgotPassword` | No |
| `/changePassword` | `changePassword` | Yes — valid access token for `directoryName` |

Each path is prefixed with `basePath` when provided (e.g. `/auth/login`). The handler stories correspond to the [User Directory actions](../../actions/core/user-directory/ask-user-directory-authenticate-user.md) — for example `login` authenticates a user, `refreshToken` refreshes an access token, and `respondToAuthChallenge` completes a challenge/MFA flow.

`/logout` and `/logoutEverywhere` are unauthenticated routes that are each self-authorizing by the token they carry, and both are best-effort — they always respond `{ success: true }` even if the token was already invalid, since a client's local logout must never fail:

- `/logout` takes `{ refreshToken }` in the body and revokes just that one session ([askUserDirectoryRevokeRefreshToken](../../actions/core/user-directory/ask-user-directory-revoke-refresh-token.md)) — "log out this device."
- `/logoutEverywhere` reads the access token from the request headers and revokes every session for that user ([askUserDirectorySignOutUser](../../actions/core/user-directory/ask-user-directory-sign-out-user.md)) — "sign out of all devices."

## How auth ties routes to the user directory

A route becomes authenticated by setting `routeAuthSettings.userDirectoryName` (which `defineAuthSystem` does for `/changePassword`). At runtime the webserver validates the caller's access token against that directory before invoking the handler — decoding the token, checking it is valid, and making its claims/roles available. Any route in the application (not just the ones generated here) can opt into the same protection by referencing this directory's name, because the directory is declared ungated at the top level.

To protect your own routes with this directory, set `routeAuthSettings: { userDirectoryName: 'app-users' }` on the route (optionally with `scopes` to require specific claims). API-key auth is the complementary mechanism — see [defineApiKey](./api-key.md).

## Examples

```typescript
import { defineAuthSystem, UserDirectoryMfaMode } from '@qpqjs/webserver';

export default [
  // Minimal: creates the 'app-users' directory + /login, /refreshToken, etc.
  ...defineAuthSystem('auth', 'app-users'),

  // Prefixed, self sign-up, required MFA, custom emails
  ...defineAuthSystem('auth', 'app-users', {
    basePath: '/auth',
    selfSignUpEnabled: true,
    mfa: { mode: UserDirectoryMfaMode.required },
    emailTemplates: {
      verifyEmail: '/entry/auth/verifyEmail::verifyEmail',
    },
    allowedOrigins: ['https://app.example.com'],
  }),
];
```

## Related

- [defineUserDirectory](../../config/core/user-directory.md) — the user directory `defineAuthSystem` creates; documents the directory options that `phoneRequired`, `selfSignUpEnabled`, `emailTemplates`, and `mfa` forward to, plus the AWS Cognito infrastructure.
- [defineApiKey](./api-key.md) — the complementary auth mechanism (shared-secret / machine callers) for routes.
- **User Directory actions** — the auth operations the generated handlers wrap: [askUserDirectoryAuthenticateUser](../../actions/core/user-directory/ask-user-directory-authenticate-user.md), [askUserDirectoryRefreshToken](../../actions/core/user-directory/ask-user-directory-refresh-token.md), [askUserDirectoryRevokeRefreshToken](../../actions/core/user-directory/ask-user-directory-revoke-refresh-token.md), [askUserDirectorySignOutUser](../../actions/core/user-directory/ask-user-directory-sign-out-user.md), [askUserDirectoryRespondToAuthChallenge](../../actions/core/user-directory/ask-user-directory-respond-to-auth-challenge.md), [askUserDirectoryChangePassword](../../actions/core/user-directory/ask-user-directory-change-password.md), [askUserDirectoryForgotPassword](../../actions/core/user-directory/ask-user-directory-forgot-password.md), [askUserDirectoryConfirmForgotPassword](../../actions/core/user-directory/ask-user-directory-confirm-forgot-password.md), [askUserDirectoryAssociateSoftwareToken](../../actions/core/user-directory/ask-user-directory-associate-software-token.md).
- **Routes and APIs** — the generated endpoints are `defineRoute` settings; see the route / `defineApi` config settings in @qpqjs/webserver to add and protect your own routes with this directory.
