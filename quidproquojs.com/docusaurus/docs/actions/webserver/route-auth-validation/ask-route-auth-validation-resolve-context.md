---
title: askRouteAuthValidationResolveContext
description: Resolve extra story context (such as a tenant's storage scope) for an incoming request, after its auth token is decoded.
---

# askRouteAuthValidationResolveContext

Resolves **extra context for an incoming HTTP request**, after [askRouteAuthValidationDecode](./ask-route-auth-validation-decode.md) has worked out who is calling. Whatever it returns is merged into the story session's context, so the route's story (and every story it calls) runs with it already provided.

The default processor returns `{}`. A route that needs more attaches its own processor for this action through its runtime's `actionProcessors`, the same way a custom decode is attached. The typical use is tenancy: a token that belongs to one tenant resolves to that tenant's storage scope, so nothing downstream needs a tenant argument.

It runs twice per request:

1. In the auth preamble, after the decode and any api key check. If it errors, the request gets a 401 and the route never runs.
2. When the story session is built. Its result becomes part of the session context. If it errors here, the request fails rather than running without the context.

- **Action type:** `RouteAuthValidationActionType.ResolveContext`

```typescript
import { actionResult, actionResultError, createActionProcessor, ErrorTypeEnum, storageScopeContext } from 'quidproquo-core';
import { askRouteAuthValidationResolveContext } from 'quidproquo-webserver';

// Attached to one route's runtime via actionProcessors.
export const getTenantContextProcessor = createActionProcessor(askRouteAuthValidationResolveContext, () => async ({ decodedAccessToken }) => {
  const tenantId = await lookUpTokenTenant(decodedAccessToken);

  if (!tenantId) {
    return actionResultError(ErrorTypeEnum.Forbidden, 'Not a member of this tenant');
  }

  return actionResult({ [storageScopeContext.uniqueName]: `TENANT#${tenantId}` });
});
```

## Signature

```typescript
function* askRouteAuthValidationResolveContext(
  event: HTTPEvent,
  routeAuthSettings: RouteAuthSettings,
  decodedAccessToken: Nullable<DecodedAccessToken>,
): AskResponse<QpqContext<unknown>>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `event` | `HTTPEvent` | The incoming HTTP request. |
| `routeAuthSettings` | `RouteAuthSettings` | The route's auth settings. See [defineRoute](../../../config/webserver/route.md). |
| `decodedAccessToken` | `Nullable<DecodedAccessToken>` | The token the decode validated, or `null` when there was none. An unverified token sent to a route without token auth is never passed here. |

## Returns

`QpqContext<unknown>`: context values keyed by context identifier `uniqueName`, merged over the session's existing context.

## Security

An override decides what every story on the route runs as, so it must fail closed. Return an error for anything it cannot confirm (an unknown, expired or revoked token, or a user no longer in the tenant). Never return a default scope on failure.

## Related

- [askRouteAuthValidationDecode](./ask-route-auth-validation-decode.md): works out the caller first.
