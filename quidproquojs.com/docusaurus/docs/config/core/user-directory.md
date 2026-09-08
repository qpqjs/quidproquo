---
title: defineUserDirectory
description: Define a user directory — a named authentication & user store (an AWS Cognito user pool) that the User Directory actions authenticate and manage users against.
---

# defineUserDirectory

Defines a **user directory**: a named store of user accounts with authentication, passwords, MFA, and profile attributes. Stories never talk to Cognito (or any identity provider) directly — they create users, sign them in, respond to auth challenges, and read/write attributes by drive name using the [User Directory action requesters](../../actions/core/user-directory/ask-user-directory-authenticate-user.md), and the runtime maps the directory to real identity infrastructure.

- **On AWS:** deploys an AWS Cognito **user pool** and an app **client** (`QpqInfCoreUserDirectoryConstruct` in `quidproquo-deploy-awscdk`). The pool enforces a fixed password policy (min 12 chars; requires lower- and upper-case, digits, and symbols), makes `email` a required, mutable, auto-verified standard attribute, and configures MFA from the `mfa` option. The app client is generated with a secret and enables the `ADMIN_USER_PASSWORD_AUTH` flow (and `CUSTOM_AUTH` when `customAuthRuntime` is set). The pool is **retained** on stack teardown by default (user accounts are unrecoverable) unless the service opts into destroy via `defineAwsDataStoreRemovalPolicy`. See [On AWS](#on-aws) for the full breakdown.

```typescript
import { defineUserDirectory } from 'quidproquo-core';

export default [
  defineUserDirectory('app-users'),
];
```

## Signature

```typescript
function defineUserDirectory(
  name: string,
  options?: QPQConfigAdvancedUserDirectorySettings,
): UserDirectoryQPQConfigSetting;
```

## Parameters

### `name` — `string` (required)

The name of the directory. This is the name you pass as the `userDirectoryName` argument to every User Directory action (e.g. `askUserDirectoryAuthenticateUser('app-users', ...)`). It is also the directory's `uniqueKey` within the config, and on AWS it is used to derive the physical user pool name (prefixed with application/module/environment, so the same config deploys to multiple environments without collisions).

### `options` — `QPQConfigAdvancedUserDirectorySettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `phoneRequired` | `boolean` | `false` | Makes `phoneNumber` a required (and auto-verified) standard attribute on the pool in addition to `email`. |
| `selfSignUpEnabled` | `boolean` | `false` | Allows users to sign themselves up (Cognito `selfSignUpEnabled`). When `false`, accounts must be created administratively via [askUserDirectoryCreateUser](../../actions/core/user-directory/ask-user-directory-create-user.md). |
| `emailTemplates` | `EmailTemplates` | – | Story functions that customise the emails Cognito sends (verification, password reset). See [Email templates](#email-templates). |
| `owner` | `CrossModuleOwner<'userDirectoryName'>` | – | Declares that this directory is owned by **another** module/service. Use this to authenticate against / manage a pool deployed elsewhere: the deploy grants this service IAM access to the foreign pool instead of creating a new one. `{ module, application, feature, environment, userDirectoryName }` — all optional; unset parts default to the current service. |
| `dnsRecord` | `AuthDirectoryDnsRecord` | – | Serves the pool's hosted UI / OAuth endpoints from a custom domain. See [DNS record](#dns-record). |
| `customAuthRuntime` | `CustomAuthRuntime` | – | Enables Cognito's `CUSTOM_AUTH` flow, wiring story functions to the define/create/verify auth-challenge Lambda triggers. See [Custom auth runtime](#custom-auth-runtime). |
| `mfa` | `UserDirectoryMfaSettings` | `{ mode: off, secondFactors: [totp] }` | Multi-factor authentication configuration. See [MFA](#mfa). |
| `accessTokenValidityMinutes` | `number` | `60` (Cognito default) | Access/ID token (JWT) lifetime in minutes (Cognito allows 5–1440). Shorter shrinks the window in which a revoked session's still-valid access token keeps working, since access tokens are stateless and can't be revoked before they expire — see [askUserDirectoryRevokeRefreshToken](../../actions/core/user-directory/ask-user-directory-revoke-refresh-token.md) / [askUserDirectorySignOutUser](../../actions/core/user-directory/ask-user-directory-sign-out-user.md). Keep it comfortably above however long the client waits before refreshing. |
| `deprecated` | `boolean` | `false` | Inherited from `QPQConfigAdvancedSettings`; marks the setting as deprecated. |

## MFA

```typescript
export enum UserDirectoryMfaMode {
  off = 'off',
  optional = 'optional',
  required = 'required',
}

export enum UserDirectoryMfaSecondFactor {
  totp = 'totp',
}

export interface UserDirectoryMfaSettings {
  mode: UserDirectoryMfaMode;
  secondFactors?: UserDirectoryMfaSecondFactor[];
}
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `mode` | `UserDirectoryMfaMode` | `off` | `off` disables MFA, `optional` lets users enrol, `required` forces every user through MFA. On AWS this maps to Cognito's `Mfa.OFF` / `Mfa.OPTIONAL` / `Mfa.REQUIRED`. |
| `secondFactors` | `UserDirectoryMfaSecondFactor[]` | `[totp]` | Enabled second factors. Currently only `totp` (authenticator-app / software token) is supported; SMS is not yet available. Defaults to `[totp]` when omitted or empty. |

When MFA is `required` (or `optional` and the user has enrolled), authentication surfaces one of the MFA auth challenges — see [askUserDirectoryAuthenticateUser](../../actions/core/user-directory/ask-user-directory-authenticate-user.md) and [askUserDirectoryAssociateSoftwareToken](../../actions/core/user-directory/ask-user-directory-associate-software-token.md).

## Email templates

```typescript
export interface EmailTemplates {
  verifyEmail?: QpqFunctionRuntime;
  resetPassword?: QpqFunctionRuntime;
  resetPasswordAdmin?: QpqFunctionRuntime;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `verifyEmail` | `QpqFunctionRuntime` | Story that renders the email-address verification message. |
| `resetPassword` | `QpqFunctionRuntime` | Story that renders the user-initiated password-reset (forgot-password) message. |
| `resetPasswordAdmin` | `QpqFunctionRuntime` | Story that renders the admin-initiated password-reset message. |

Each handler is a `QpqFunctionRuntime` — a reference to a story entry point, usually written as a relative path string in the form `'/path/to/file::exportedFunctionName'`. Providing **any** of these installs a Cognito `CUSTOM_MESSAGE` Lambda trigger on the pool.

## DNS record

```typescript
export type AuthDirectoryDnsRecord = {
  subdomain: string;
};
```

Attaches a Cognito custom domain to the pool and creates the matching Route 53 alias record. A pool has one custom domain, so it lives on the **primary** root from [defineDns](../webserver/dns.md) (the `{ subdomain }` target under the app's domain resolver). Because Cognito custom domains run on CloudFront, the ACM certificate is looked up in `us-east-1`.

## Custom auth runtime

```typescript
export interface CustomAuthRuntime {
  defineAuthChallenge: QpqFunctionRuntime;
  createAuthChallenge?: QpqFunctionRuntime;
  verifyAuthChallenge?: QpqFunctionRuntime;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `defineAuthChallenge` | `QpqFunctionRuntime` | Required. Story wired to Cognito's `DEFINE_AUTH_CHALLENGE` trigger — drives the custom challenge state machine. |
| `createAuthChallenge` | `QpqFunctionRuntime` | Optional. Story wired to `CREATE_AUTH_CHALLENGE` — produces the challenge presented to the user. |
| `verifyAuthChallenge` | `QpqFunctionRuntime` | Optional. Story wired to `VERIFY_AUTH_CHALLENGE_RESPONSE` — validates the user's answer. |

Setting `customAuthRuntime` enables the app client's `CUSTOM_AUTH` flow. Authenticate with the `isCustom` flag set (see [askUserDirectoryAuthenticateUser](../../actions/core/user-directory/ask-user-directory-authenticate-user.md)) and answer with the `CUSTOM_CHALLENGE` variant of [askUserDirectoryRespondToAuthChallenge](../../actions/core/user-directory/ask-user-directory-respond-to-auth-challenge.md).

## On AWS

The `QpqInfCoreUserDirectoryConstruct` deploys:

- **A Cognito user pool** with:
  - **Password policy** (fixed): minimum length 12; requires lowercase, uppercase, digits, and symbols.
  - **Standard attributes**: `email` (required, mutable) and `phoneNumber` (mutable; required only when `phoneRequired` is `true`).
  - **Auto-verification**: `email` (and `phone` when `phoneRequired`).
  - **MFA**: mode and second factors derived from the `mfa` option (TOTP / software token).
  - **Self sign-up**: from `selfSignUpEnabled`.
  - **Removal policy**: retained by default (with deletion protection); destroyed only when the service sets `defineAwsDataStoreRemovalPolicy(destroy)`.
- **Lambda triggers** (only when configured):
  - `CUSTOM_MESSAGE` — when any `emailTemplates` handler is set.
  - `DEFINE_AUTH_CHALLENGE`, and optionally `CREATE_AUTH_CHALLENGE` / `VERIFY_AUTH_CHALLENGE_RESPONSE` — when `customAuthRuntime` is set.
- **An app client** with a generated secret, `ADMIN_USER_PASSWORD_AUTH` enabled, `CUSTOM_AUTH` enabled when `customAuthRuntime` is set, and access/ID token validity set from `accessTokenValidityMinutes` (Cognito's 60-minute default when omitted).
- **A custom domain + Route 53 alias** — when `dnsRecord` is set (certificate from `us-east-1`).

Services that own a directory get IAM for the admin Cognito operations the actions use (create user, initiate/respond to auth, list/get users, update attributes, set password, describe pool/client, etc.). Services that only reference a **foreign** directory (via `owner`) get no Cognito IAM — token validation runs against the pool's public JWKs over HTTPS and needs none.

## Examples

```typescript
import {
  defineUserDirectory,
  UserDirectoryMfaMode,
  UserDirectoryMfaSecondFactor,
} from 'quidproquo-core';

export default [
  // Simple admin-managed directory
  defineUserDirectory('app-users'),

  // Self sign-up with optional TOTP MFA and a custom verification email
  defineUserDirectory('customers', {
    selfSignUpEnabled: true,
    mfa: {
      mode: UserDirectoryMfaMode.optional,
      secondFactors: [UserDirectoryMfaSecondFactor.totp],
    },
    emailTemplates: {
      verifyEmail: '/entry/auth/emails::renderVerifyEmail',
      resetPassword: '/entry/auth/emails::renderResetPassword',
    },
  }),

  // Required MFA served from a custom domain
  defineUserDirectory('staff', {
    mfa: { mode: UserDirectoryMfaMode.required },
    dnsRecord: { subdomain: 'auth' },
  }),

  // Authenticate against a directory owned by another service
  defineUserDirectory('shared-identity', {
    owner: { module: 'identity-service' },
  }),
];
```

## Related

- **Authentication:** [askUserDirectoryAuthenticateUser](../../actions/core/user-directory/ask-user-directory-authenticate-user.md), [askUserDirectoryRespondToAuthChallenge](../../actions/core/user-directory/ask-user-directory-respond-to-auth-challenge.md), [askUserDirectoryRefreshToken](../../actions/core/user-directory/ask-user-directory-refresh-token.md).
- **Account management:** [askUserDirectoryCreateUser](../../actions/core/user-directory/ask-user-directory-create-user.md), [askUserDirectoryGetUsers](../../actions/core/user-directory/ask-user-directory-get-users.md), [askUserDirectorySetUserAttributes](../../actions/core/user-directory/ask-user-directory-set-user-attributes.md).
- **Passwords:** [askUserDirectoryChangePassword](../../actions/core/user-directory/ask-user-directory-change-password.md), [askUserDirectoryForgotPassword](../../actions/core/user-directory/ask-user-directory-forgot-password.md), [askUserDirectorySetPassword](../../actions/core/user-directory/ask-user-directory-set-password.md).
- **MFA:** [askUserDirectoryAssociateSoftwareToken](../../actions/core/user-directory/ask-user-directory-associate-software-token.md).
- **Tokens:** [askUserDirectoryReadAccessToken](../../actions/core/user-directory/ask-user-directory-read-access-token.md), [askUserDirectoryDecodeAccessToken](../../actions/core/user-directory/ask-user-directory-decode-access-token.md).
- **Signing out:** [askUserDirectoryRevokeRefreshToken](../../actions/core/user-directory/ask-user-directory-revoke-refresh-token.md) (single session), [askUserDirectorySignOutUser](../../actions/core/user-directory/ask-user-directory-sign-out-user.md) (every session).
- **All User Directory actions:** see the [User Directory actions](../../actions/core/user-directory/ask-user-directory-authenticate-user.md) group.
- **Turn-key auth:** [defineAuthSystem](../webserver/auth-system.md) (quidproquo-webserver) creates a user directory and the login / refresh / password-recovery HTTP routes in one call.
- **AWS tuning:** [defineAwsDataStoreRemovalPolicy](../config-aws/aws-data-store-removal-policy.md) — retain vs destroy the Cognito user pool on teardown.
- **Admin dashboard:** [defineAdminUserDirectory](../features/admin-user-directory.md) (quidproquo-features) wraps this to declare the `qpq-admin` directory the admin dashboard authenticates against.
