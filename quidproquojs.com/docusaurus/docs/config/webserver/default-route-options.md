---
title: defineDefaultRouteOptions
description: Declare CORS and auth defaults that are merged into every route in a service.
---

# defineDefaultRouteOptions

Declares **default route options** — CORS origins and auth settings that are merged into every [route](./route.md) in the service. Use it to apply a shared authentication policy or a common set of allowed browser origins once, instead of repeating the same options on each route.

- **On AWS:** no infrastructure of its own. The defaults are merged into each route's options at runtime by the API Lambda; see [defineApi](./api.md).

```typescript
import { defineDefaultRouteOptions } from '@qpqjs/webserver';

export default [
  defineDefaultRouteOptions('web', {
    allowedOrigins: ['https://app.example.com'],
    routeAuthSettings: {
      userDirectoryName: 'users',
    },
  }),
];
```

## Signature

```typescript
function defineDefaultRouteOptions(
  groupName: string,
  routeOptions: RouteOptions,
): DefaultRouteOptionsQPQWebServerConfigSetting;
```

## Parameters

### `groupName` — `string` (required)

A unique key for this set of defaults. Every declared default-route-options setting is currently merged into every route in the service regardless of `groupName`; the name simply keeps multiple declarations distinct within the config.

### `routeOptions` — `RouteOptions` (required)

The options to merge into each route.

| Property | Type | Description |
| --- | --- | --- |
| `allowedOrigins` | `(string \| ServiceAllowedOrigin)[]` | Browser origins allowed to call routes (CORS). Unioned with each route's own `allowedOrigins`. |
| `routeAuthSettings` | `RouteAuthSettings` | Default auth policy — `userDirectoryName`, `scopes`, and `apiKeys`. Merged with each route's own auth settings (user directory falls back to the default; scopes and api keys are combined). |

The shapes of `RouteOptions`, `RouteAuthSettings`, and `ServiceAllowedOrigin` are documented on the [defineRoute](./route.md) page.

## Notes

- Merging is **additive**: `allowedOrigins` are unioned and `routeAuthSettings.scopes`/`apiKeys` are combined across the defaults and the per-route options. `userDirectoryName` on a route takes precedence over the default when both are set.

## Examples

```typescript
import { defineDefaultRouteOptions, defineRoute } from '@qpqjs/webserver';

export default [
  // Apply a user directory and CORS origin to all routes
  defineDefaultRouteOptions('web', {
    allowedOrigins: ['https://app.example.com'],
    routeAuthSettings: { userDirectoryName: 'users' },
  }),

  // Inherits the user directory + origin above; adds a scope requirement
  defineRoute('POST', '/orders', '/src/routes/orders/create::createOrder', {
    routeAuthSettings: { scopes: ['orders:write'] },
  }),
];
```

## Related

- [defineRoute](./route.md) — the routes these defaults are merged into.
- [defineApi](./api.md) — the API the routes are served under.
