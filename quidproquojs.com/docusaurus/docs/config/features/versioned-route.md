---
title: defineVersionedRoute
description: Define an HTTP route under a versioned path prefix (/v1, /v2, …) for API versioning.
---

# defineVersionedRoute

Defines an HTTP route whose path is prefixed with an API version segment (`/v1`, `/v2`, …). It is a thin wrapper over the webserver [defineRoute](../webserver/route.md): the only difference is that it prepends `/v{version}` to the path before delegating, so you can publish multiple concurrent versions of an endpoint without repeating the prefix at every call site.

Versioning here is purely **path-based** — there is no content negotiation or header inspection. `defineVersionedRoute('GET', '/users', runtime, {}, 2)` is exactly `defineRoute('GET', '/v2/users', runtime, {})`. Callers select a version by the URL they request; you ship a new version by declaring the same route with a higher `version` (and a new runtime), and retire an old one by removing its declaration.

`defineVersionedRoute` returns an **array** containing the single `defineRoute` setting — spread it into your service's route config.

- **On AWS:** identical to [defineRoute](../webserver/route.md) — routes are not individual infrastructure; API Gateway proxies every request to the API Lambda, which matches the full (version-prefixed) path at runtime.

```typescript
import { defineVersionedRoute } from '@qpqjs/features';

export default [
  // Served at GET /v1/users/{userId}
  ...defineVersionedRoute('GET', '/users/{userId}', '/src/routes/users/getUser::getUser'),
];
```

## Signature

```typescript
function defineVersionedRoute(
  method: HTTPMethod,
  path: string,
  runtime: QpqFunctionRuntime,
  options?: RouteOptions,
  version?: number,
): RouteQPQWebServerConfigSetting[];
```

## Parameters

### `method` — `HTTPMethod` (required)

The HTTP method to match — `'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'PATCH'`.

### `path` — `string` (required)

The URL path **without** the version prefix, e.g. `'/users/{userId}'`. The `/v{version}` segment is prepended for you. Path parameters are written with braces (`{userId}`).

### `runtime` — `QpqFunctionRuntime` (required)

A reference to the story that handles the request, usually a relative path string of the form `'/path/to/file::exportedFunctionName'`. Passed straight through to [defineRoute](../webserver/route.md).

### `options` — `RouteOptions` (optional, default `{}`)

Per-route CORS and auth options, forwarded unchanged to [defineRoute](../webserver/route.md) — `allowedOrigins`, `routeAuthSettings` (user directory, scopes, api keys). See [defineRoute](../webserver/route.md#options--genericrouteoptionsapikeyreference--string-optional) for the full shape.

### `version` — `number` (optional, default `1`)

The version number used to build the path prefix. `1` produces `/v1…`, `2` produces `/v2…`, and so on.

## Examples

```typescript
import { defineVersionedRoute } from '@qpqjs/features';

export default [
  // v1 — the original handler
  ...defineVersionedRoute('GET', '/users/{userId}', '/src/routes/users/v1/getUser::getUser'),

  // v2 — a new handler at /v2/users/{userId}, kept side-by-side with v1
  ...defineVersionedRoute('GET', '/users/{userId}', '/src/routes/users/v2/getUser::getUser', {}, 2),

  // Authenticated v2 write endpoint
  ...defineVersionedRoute(
    'POST',
    '/users',
    '/src/routes/users/v2/create::createUser',
    { routeAuthSettings: { userDirectoryName: 'users', scopes: ['users:write'] } },
    2,
  ),
];
```

## Related

- [defineRoute](../webserver/route.md) — the underlying route setting this wraps; see it for how routes are matched and served.
- [defineDefaultRouteOptions](../webserver/default-route-options.md) — service-wide CORS/auth defaults merged into each route.
