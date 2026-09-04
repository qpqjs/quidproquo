---
title: defineOpenApiRoutes
description: Serve a generated OpenAPI document and an interactive reference page for the service's routes.
---

# defineOpenApiRoutes

Mounts two routes: an interactive API reference page and the OpenAPI 3.1 document it reads. Nothing is written by hand. The document is generated from the service's route config, so every `defineRoute` shows up in it, and routes that declare a schema show their request and response shapes too.

- **On AWS:** two ordinary routes on the API Lambda. The document is built on request from the config already bundled with the service, so there is no extra infrastructure and nothing to keep in sync.

```typescript
import { defineOpenApiRoutes } from 'quidproquo-features';

export default [
  // GET /v1/docs (reference page) and GET /v1/docs/openapi.json (document)
  defineOpenApiRoutes({ info: { title: 'Widgets API', version: '1.2.0' } }),
];
```

The reference page loads [Scalar](https://scalar.com) from a CDN and points it at the document next to it. Browsers need to reach `cdn.jsdelivr.net` for the page to render; the document itself has no such dependency.

## Signature

```typescript
function defineOpenApiRoutes(options?: OpenApiRoutesOptions): QPQConfig;
```

## Parameters

### `options` — `OpenApiRoutesOptions` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `basePath` | `string` | `'/docs'` | Where the reference page is served. The document is always at `${basePath}/openapi.json`. |
| `version` | `number` | `1` | Version prefix, as with [defineVersionedRoute](./versioned-route.md). |
| `info` | `OpenApiDocumentOptions` | – | `title`, `version` and `description` for the document's info block. The title defaults to the application and module name. |
| `routeAuthSettings` | `RouteAuthSettings` | – | Gate the docs behind a user directory or api key. Public when omitted. |

## Describing a route

Any route can carry a `schema` in its options: `bodyJsonSchema`, `queryJsonSchema` and `responseJsonSchema` as plain JSON Schema (from zod, `z.toJSONSchema(MySchema)`), plus `summary`, `description` and `tags`. Set `hidden: true` to keep a route out of the document.

Routes written with `dynamicRoute` (or a `createRouteDefinition` family) take zod schemas instead and get validation for free. The body and query are parsed before the handler runs, a mismatch becomes a 422, and the parsed values arrive typed as the handler's third argument.

```typescript
import { z } from 'zod/v4';
import { dynamicRoute } from 'quidproquo-features';

export const create = dynamicRoute(
  ['POST', '/widgets'],
  function* (event, params, { body }) {
    // body is { name: string }
    return qpqWebServerUtils.toJsonEventResponse({ id: 'w1', name: body.name });
  },
  {
    schema: {
      summary: 'Create a widget',
      tags: ['widgets'],
      body: z.object({ name: z.string().min(1) }),
      response: z.object({ id: z.string(), name: z.string() }),
    },
    knownErrors: { [WidgetErrorTypeEnum.Duplicate]: 409 },
  },
);
```

## What the document contains

- One operation per route, keyed by path and method, with a stable `operationId` derived from both.
- Path parameters read from the `{param}` segments of the path.
- One query parameter per property of the query schema.
- A JSON request body when a body schema is declared, and a typed 200 response when a response schema is.
- A 422 response on routes that validate input, and a 401 on routes with auth settings.
- Security requirements from the route's merged auth settings: bearer JWT for a user directory, `x-api-key` for api keys. Only the schemes in use are published.
- A server entry per non-deprecated [defineApi](../webserver/api.md) when the service has a domain.

## Related

- [askOpenApiGetDocument](../../actions/webserver/open-api/ask-open-api-get-document.md) — the action the document route yields; use it to serve the document somewhere else.
- [defineRoute](../webserver/route.md) — the `schema` option on plain routes.
- [defineVersionedRoute](./versioned-route.md) — the version prefix these routes sit under.
