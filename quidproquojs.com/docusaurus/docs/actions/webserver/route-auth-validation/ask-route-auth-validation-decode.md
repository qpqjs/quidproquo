---
title: askRouteAuthValidationDecode
description: Decode and validate a route's incoming auth token against its route auth settings, returning a tri-state outcome.
---

# askRouteAuthValidationDecode

Decodes and validates the **auth token on an incoming HTTP request** against a route's auth settings, and returns a tri-state result: not applicable (no token auth configured for the route), valid (with the decoded access token), or invalid. This is the action the webserver runs to authenticate a route before its handler story executes; the decoding is driven by the service's auth system (see `defineAuthSystem`). It is always yielded, even for routes with no `userDirectoryName`, so a per-route processor override can implement completely custom auth.

- **Action type:** `RouteAuthValidationActionType.Decode`

```typescript
import { askRouteAuthValidationDecode, RouteAuthDecodeOutcome } from 'quidproquo-webserver';

export function* askAuthenticateRequest(event, routeAuthSettings) {
  const decodeResult = yield* askRouteAuthValidationDecode(event, routeAuthSettings, false);

  if (decodeResult.outcome === RouteAuthDecodeOutcome.invalid) {
    return null;
  }

  if (decodeResult.outcome === RouteAuthDecodeOutcome.valid) {
    return decodeResult.decodedAccessToken; // { userId, username, roles, ... }
  }

  // notApplicable: no token auth configured for this route
  return null;
}
```

## Signature

```typescript
function* askRouteAuthValidationDecode(
  event: HTTPEvent,
  routeAuthSettings: RouteAuthSettings,
  ignoreExpiration: boolean,
): AskResponse<RouteAuthDecodeResult>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `event` | `HTTPEvent` | The incoming HTTP request event carrying the auth token (typically a bearer token in the headers). |
| `routeAuthSettings` | `RouteAuthSettings` | The route's auth settings — `userDirectoryName`, `scopes`, `apiKeys` — used to decide which user directory the token is validated against. See [defineRoute](../../../config/webserver/route.md). |
| `ignoreExpiration` | `boolean` | When `true`, an expired token is still decoded (its `wasValid` reflects other checks). When `false`, expiration is enforced. |

## Returns

`RouteAuthDecodeResult` — a tri-state outcome:

```typescript
type RouteAuthDecodeResult =
  | { outcome: RouteAuthDecodeOutcome.notApplicable }
  | { outcome: RouteAuthDecodeOutcome.valid; decodedAccessToken: DecodedAccessToken }
  | { outcome: RouteAuthDecodeOutcome.invalid };

interface DecodedAccessToken {
  userId: string;
  username: string;
  exp: number;          // expiry, Unix timestamp in seconds
  roles?: string[];
  userDirectory: string;
  wasValid: boolean;    // whether the token passed validation
}
```

- `notApplicable` — no token auth is configured for the route; the request passes with an anonymous session.
- `valid` — the token decoded and validated; `decodedAccessToken` carries the identity.
- `invalid` — token auth applies and the request did not satisfy it.

## Related

- [defineRoute](../../../config/webserver/route.md) — declares the `routeAuthSettings` this action validates against.
- [askUserDirectoryDecodeAccessToken](../../core/user-directory/ask-user-directory-decode-access-token.md) — the underlying user-directory token decode.
