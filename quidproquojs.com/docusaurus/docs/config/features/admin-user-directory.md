---
title: defineAdminUserDirectory
description: Declare the user directory admins authenticate against for the quidproquo admin dashboard.
---

# defineAdminUserDirectory

Declares the **admin user directory** — the authentication store the quidproquo admin dashboard signs operators in against. It is a thin, opinionated wrapper over the core [defineUserDirectory](../core/user-directory.md): it always registers a directory under the fixed resource name `qpq-admin`, which the [admin settings](./admin-settings.md) routes reference as their `userDirectoryName`.

`defineAdminUserDirectory` returns a `QPQConfig` array. Declare it alongside [defineAdminSettings](./admin-settings.md) so the admin auth routes (`/login`, `/refreshToken`, `/challenge`) have a directory to validate tokens against.

- **On AWS:** because it delegates to [defineUserDirectory](../core/user-directory.md), it deploys a Cognito user pool and app client (or, when `owner` points at another module, a foreign reference to a pool deployed there). See [defineUserDirectory](../core/user-directory.md#on-aws) for the full breakdown.

```typescript
import { defineAdminUserDirectory } from '@qpqjs/features';

export default [
  // The admin pool is owned by the 'log' service, alongside the admin settings.
  ...defineAdminUserDirectory({ owner: { module: 'log' } }),
];
```

## Signature

```typescript
function defineAdminUserDirectory(
  options?: QPQConfigAdvancedAdminUserDirectorySettings,
): QPQConfig;
```

## Parameters

### `options` — `QPQConfigAdvancedAdminUserDirectorySettings` (optional)

```typescript
type QPQConfigAdvancedAdminUserDirectorySettings =
  Required<Pick<QPQConfigAdvancedUserDirectorySettings, 'owner'>>;
```

The options are narrowed from [`QPQConfigAdvancedUserDirectorySettings`](../core/user-directory.md#options--qpqconfigadvanceduserdirectorysettings-optional) to a single **required** property: `owner`. When you pass options, you must supply `owner`.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `owner` | `CrossModuleOwner<'userDirectoryName'>` | – | Declares which module/service owns the `qpq-admin` pool. Pass the module that hosts your admin settings (the `logServiceName` you give [defineAdminSettings](./admin-settings.md)) so the pool is deployed there and every other service references it as a foreign directory rather than creating its own. `{ module, application, feature, environment, userDirectoryName }` — all parts optional, unset parts default to the current service. |

Omit `options` entirely to deploy the `qpq-admin` directory as owned by the current service.

## Notes

- The directory is always named `qpq-admin`. That name is what the admin auth and log routes declared by [defineAdminSettings](./admin-settings.md) pass as their `routeAuthSettings.userDirectoryName`, and what the [admin session event doc](./admin-session-event-doc.md) authenticates against.
- All other user-directory options (MFA, self-sign-up, email templates, custom auth) are intentionally not exposed here — the admin directory uses the core defaults.

## Related

- [defineUserDirectory](../core/user-directory.md) — the core directory this wraps; see it for the deployed infrastructure and the full option set.
- [defineAdminSettings](./admin-settings.md) — declares the admin routes that authenticate against this directory.
- [defineAdminSessionEventDoc](./admin-session-event-doc.md) — the admin session document, also scoped to this directory.
