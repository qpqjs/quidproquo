---
title: askEventDocResolveActor
description: Request-time helpers for event-doc route controllers — resolve the acting user from the access token and parse the request body.
---

# Request helpers

Small helpers used inside event-doc route controllers to turn an authenticated HTTP request into the pieces an append needs: who is acting, and the parsed body. `askEventDocResolveActor` and `askEventDocResolveUserId` both read the already-validated access token (route auth gated the request), so they stamp provenance without a separate user lookup; `askEventDocParseBody` parses JSON safely.

## askEventDocResolveActor

Resolves the acting user as an `EventDocEventActor` — `{ userId, userDisplayName }` — straight off the validated access token (which carries the username). The natural source for the `actor` argument of [askEventDocEventAppend](./ask-event-doc-event-append.md) and [askEventDocAppendServerEvent](./ask-event-doc-append-server-event.md).

- **Built from:** [askConfigGetGlobal](../../core/config/ask-config-get-global.md) (the user-directory global) + [askUserDirectoryReadAccessToken](../../core/user-directory/ask-user-directory-read-access-token.md). Not a single action.

```typescript
import { askEventDocResolveActor } from '@qpqjs/features';

export function* appendController(docId: string, input: EventDocEventInput) {
  const actor = yield* askEventDocResolveActor();
  return yield* askEventDocEventAppend(docId, input, actor);
}
```

### Signature

```typescript
function* askEventDocResolveActor(): AskResponse<EventDocEventActor>;
```

### Returns

`AskResponse<EventDocEventActor>` — `{ userId, userDisplayName }`. `userId` is the stable authoritative key; `userDisplayName` is the token's username, captured for display at append time.

### Notes

- Throws `ErrorTypeEnum.Unauthorized` ("User not authenticated") when the token has no `userId`.
- Reads the user directory named by the `eventDocUserDirectory` route global.

## askEventDocResolveUserId

Resolves just the acting user's id — a `string` — from the same validated access token. Use it where only the id is needed (e.g. stamping `createdBy` / `updatedBy` on a record) rather than the full actor.

- **Built from:** [askConfigGetGlobal](../../core/config/ask-config-get-global.md) + [askUserDirectoryReadAccessToken](../../core/user-directory/ask-user-directory-read-access-token.md). Not a single action.

```typescript
import { askEventDocResolveUserId } from '@qpqjs/features';

export function* whoAmI() {
  return yield* askEventDocResolveUserId(); // string userId
}
```

### Signature

```typescript
function* askEventDocResolveUserId(): AskResponse<string>;
```

### Returns

`AskResponse<string>` — the acting user's id.

### Notes

- Throws `ErrorTypeEnum.Unauthorized` ("User not authenticated") when the token has no `userId`.

## askEventDocParseBody

Parses an HTTP request body as JSON, transparently base64-decoding it first when the event is base64-encoded, and throwing on malformed input. A typed convenience for controllers reading a JSON POST body (e.g. an `EventDocEventInput`).

```typescript
import { askEventDocParseBody } from '@qpqjs/features';
import { HTTPEvent } from '@qpqjs/webserver';

export function* appendRoute(event: HTTPEvent) {
  const input = yield* askEventDocParseBody<EventDocEventInput>(event);
  // ... use input
}
```

### Signature

```typescript
function* askEventDocParseBody<T extends object>(event: HTTPEvent): AskResponse<T>;
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `event` | `HTTPEvent` | The incoming HTTP event (from `@qpqjs/webserver`); its `body` / `isBase64Encoded` fields are read. |

### Returns

`AskResponse<T>` — the parsed body, cast to `T`. An absent body parses as `{}`.

### Notes

- Throws `ErrorTypeEnum.BadRequest` ("Invalid JSON request body") when the body is not valid JSON or does not parse to an object.

## Related

- [askEventDocEventAppend](./ask-event-doc-event-append.md) — consumes the resolved actor and parsed body.
- [askEventDocAppendServerEvent](./ask-event-doc-append-server-event.md) — also takes a resolved actor.
- [askEventDocProvideStore](./ask-event-doc-provide-store.md) — the store context controllers establish alongside these helpers.
- [askUserDirectoryReadAccessToken](../../core/user-directory/ask-user-directory-read-access-token.md) — the core action the actor/user resolvers read.
