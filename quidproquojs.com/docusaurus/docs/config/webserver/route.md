---
title: defineRoute
description: Define a single HTTP route — map a method and path to a story runtime, with per-route CORS and auth options.
---

# defineRoute

Defines an **HTTP route**: a mapping from an HTTP method and URL path to a **story runtime** that handles the request. Routes are served under the service's [API](./api.md). Each incoming request matching the method and path runs the referenced story, which returns the HTTP response.

- **On AWS:** routes are not individual infrastructure. API Gateway proxies every request to the single API Lambda, which matches the request against all declared routes at runtime and dispatches to the matching story. See [defineApi](./api.md) for the deployed resources.

```typescript
import { defineRoute } from 'quidproquo-webserver';

export default [
  defineRoute('GET', '/users/{userId}', '/src/routes/users/getUser::getUser'),
];
```

## Signature

```typescript
function defineRoute(
  method: HTTPMethod,
  path: string,
  runtime: QpqFunctionRuntime,
  options?: GenericRouteOptions<ApiKeyReference | string>,
): RouteQPQWebServerConfigSetting;
```

## Parameters

### `method` — `HTTPMethod` (required)

The HTTP method to match. `HTTPMethod` is one of `'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'PATCH'`.

### `path` — `string` (required)

The URL path to match, e.g. `'/users/{userId}'`. Path parameters are written with braces (`{userId}`) and are made available to the handling story via the HTTP event.

### `runtime` — `QpqFunctionRuntime` (required)

A reference to the story that handles the request. Usually written as a relative path string of the form `'/path/to/file::exportedFunctionName'` (for example `'/src/routes/users/getUser::getUser'`). The handler story receives the HTTP event and returns the HTTP response. This value is also the route's `uniqueKey`.

### `options` — `GenericRouteOptions<ApiKeyReference | string>` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `allowedOrigins` | `(string \| ServiceAllowedOrigin)[]` | – | Browser origins allowed to call this route (CORS). Either literal origin strings or `ServiceAllowedOrigin` descriptors resolved to another qpq service's domain. Merged with any [default route options](./default-route-options.md). |
| `routeAuthSettings` | `RouteAuthSettings` | – | How the route is authenticated/authorized. See below. |
| `schema` | `RouteSchema` | – | `bodyJsonSchema`, `queryJsonSchema` and `responseJsonSchema` as JSON Schema, plus `summary`, `description`, `tags` and `hidden`. Feeds the generated OpenAPI document; see [defineOpenApiRoutes](../features/open-api-routes.md). Routes written with `dynamicRoute` fill this in from zod schemas for you. |

#### `RouteAuthSettings`

| Property | Type | Description |
| --- | --- | --- |
| `userDirectoryName` | `string` | Name of the `defineUserDirectory` whose access tokens authenticate this route. The request's bearer token is decoded and validated against this directory. |
| `scopes` | `string[]` | Scopes/roles the caller's token must carry to be authorized. |
| `apiKeys` | `(ApiKeyReference \| string)[]` | API keys accepted for this route. A plain string is shorthand for `{ name }`; use an `ApiKeyReference` (`{ name, applicationName?, serviceName? }`) to reference a key declared in another application or service. |

#### `ServiceAllowedOrigin`

| Property | Type | Description |
| --- | --- | --- |
| `api` | `string` | The API subdomain name of the target service. |
| `domain` | `string` | The domain the target service is hosted on. Defaults to this service's domain. |
| `service` | `string` | The service name as seen in the subdomain. |
| `protocol` | `'http' \| 'https'` | Protocol to use; defaults to `https`. |

## Notes

- Route options are **merged** with every [defineDefaultRouteOptions](./default-route-options.md) declared in the service: `allowedOrigins` are unioned and `routeAuthSettings` (user directory, scopes, api keys) are combined. Per-route settings and defaults add together rather than one replacing the other.
- Auth decoding and validation of the incoming token is performed by the `askRouteAuthValidationDecode` action, driven by the service's auth system (see `defineAuthSystem`).

## Examples

```typescript
import { defineRoute } from 'quidproquo-webserver';

export default [
  // Public read endpoint
  defineRoute('GET', '/articles', '/src/routes/articles/list::listArticles'),

  // Path parameter
  defineRoute('GET', '/articles/{articleId}', '/src/routes/articles/get::getArticle'),

  // Authenticated write, requires a user directory token with a scope
  defineRoute('POST', '/articles', '/src/routes/articles/create::createArticle', {
    routeAuthSettings: {
      userDirectoryName: 'users',
      scopes: ['articles:write'],
    },
  }),

  // Protected by an API key
  defineRoute('POST', '/webhooks/stripe', '/src/routes/webhooks/stripe::onStripeEvent', {
    routeAuthSettings: {
      apiKeys: ['stripe-webhook-key'],
    },
  }),
];
```

## Related

- [defineApi](./api.md) — the API the route is served under.
- [defineDefaultRouteOptions](./default-route-options.md) — service-wide CORS/auth defaults merged into each route.
- [defineServiceFunction](./service-function.md) — RPC-style handlers that are not exposed as HTTP routes.
- [askRouteAuthValidationDecode](../../actions/webserver/route-auth-validation/ask-route-auth-validation-decode.md) — decodes and validates a route's auth token.
- [defineVersionedRoute](../features/versioned-route.md) — wraps this to serve a route under a `/v1`, `/v2`, … version prefix.
