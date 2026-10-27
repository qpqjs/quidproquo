---
title: askEventDocProvideStore
description: Provide and read the EventDoc store context that binds the generic event-doc data stories to one collection.
---

# The EventDoc store context

Every generic event-doc data story — [askEventDocEventAppend](./ask-event-doc-event-append.md), the [event readers](./ask-event-doc-event-list.md), the [asset helpers](./ask-event-doc-generate-asset-upload-url.md), `askEventDocGetByIdOrThrow`, and the rest — needs to know **which collection** it is operating on: the events-store name, the record store name, the blob drive, and the document `type`. Rather than thread that through every call, event-doc uses the core context system: you **provide** the store binding once around a sub-story, and the data stories **read** it back internally.

This is the same pattern as [askContextProvideValue](../../core/context/ask-context-provide-value.md) / [askContextRead](../../core/context/ask-context-read.md), specialised to an `EventDocStore`. The context is a **local** context (never serialized across a service boundary), and its default is empty — so reads outside a provider return blank fields, which is why [askEventDocResolveStore](#askeventdocresolvestore) exists to fail loudly.

### `EventDocStore` — the binding

| Property | Type | Description |
| --- | --- | --- |
| `storeName` | `string` | The record (summary) store name for the collection. |
| `eventsStoreName` | `string` | The events-log store name — by convention `` `${storeName}Events` ``. |
| `type` | `string` | Pins the document type within a store that can hold several. |
| `storageDriveName` | `string` | The collection's blob bucket (assets + runtime artifacts), keyed per-doc. |
| `onPublish` | `string` (optional) | The collection's on-publish inline-function name, if configured. Invoked after a Publish event is durably appended. |
| `onAppend` | `string` (optional) | The collection's on-append inline-function name, if configured. Invoked after every successful append. |
| `scopeResolver` | `string` (optional) | The collection's ambient storage scope resolver inline-function name, if configured (e.g. per-tenant). |

Render, references, and snapshot behaviour are no longer carried on the store binding — they come from the collection's registered `EventDocFunctions` object, addressed by `storeName`/`type` via `eventDocFunctionsName(storeName, type)` (see [defineEventDoc](../../../config/features/event-doc.md)).

There are two ways to establish the context — one for custom routes, one for the built-in routes — plus the raw provide/read primitives and a resolver that throws when the binding is missing.

## askEventDocProvideStore

Provides the store context for a collection identified by `storeName` + `type`, deriving the events-store and blob-drive names from `storeName`. Use it in a **custom** route (one outside `defineEventDocRoutes`, which has no per-route globals) so its sub-story can call the generic `askEventDocEvent*` / `askEventDocGetByIdOrThrow` data functions. It is the hand-written counterpart to [askEventDocProvideStoreFromGlobals](#askeventdocprovidestorefromglobals).

```typescript
import { askEventDocProvideStore } from '@qpqjs/features';

export function* customAppendRoute(docId: string, input: EventDocEventInput) {
  return yield* askEventDocProvideStore(
    { storeName: 'reports', type: 'report' },
    (function* () {
      const actor = yield* askEventDocResolveActor();
      return yield* askEventDocEventAppend(docId, input, actor);
    })(),
  );
}
```

### Signature

```typescript
function* askEventDocProvideStore<T>(
  options: EventDocStoreOptions,
  story: AskResponse<T>,
): AskResponse<T>;
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `options` | `EventDocStoreOptions` | The collection identity, minus the derivable bits — see below. |
| `story` | `AskResponse<T>` | The sub-story to run with the store context bound. Its return value is passed through. |

#### `EventDocStoreOptions`

| Property | Type | Description |
| --- | --- | --- |
| `storeName` | `string` | The collection's record store name; the events-table and blob-drive names are derived from it. |
| `type` | `string` | The document type pinned within the store. |
| `onPublish` | `string` (optional) | Inline-function name invoked after a Publish append. |
| `onAppend` | `string` (optional) | Inline-function name invoked after every append. |
| `scopeResolver` | `string` (optional) | Ambient storage scope resolver inline-function name. |

### Returns

`AskResponse<T>` — whatever `story` returns.

## askEventDocProvideStoreFromGlobals

The built-in-routes counterpart: bridges the per-route **globals** that `defineEventDocRoutes` sets (store name, events-store name, type, storage drive, and the optional onPublish/onAppend/scopeResolver hooks) into the store context, then runs the controller sub-story. Reads each global with [askConfigGetGlobal](../../core/config/ask-config-get-global.md), which throws if a route forgot to set them.

```typescript
import { askEventDocProvideStoreFromGlobals } from '@qpqjs/features';

export function* getEventsController(event: HTTPEvent) {
  return yield* askEventDocProvideStoreFromGlobals(
    (function* () {
      const docId = event.params.id;
      return yield* askEventDocEventList(docId);
    })(),
  );
}
```

### Signature

```typescript
function* askEventDocProvideStoreFromGlobals<T>(story: AskResponse<T>): AskResponse<T>;
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `story` | `AskResponse<T>` | The controller sub-story to run with the store context bound from route globals. |

### Returns

`AskResponse<T>` — whatever `story` returns.

## askEventDocStoreProvide

The raw context **provider**: binds a fully-formed [`EventDocStore`](#eventdocstore--the-binding) (no derivation) around a sub-story. Built with `createContextProvider`. Both [askEventDocProvideStore](#askeventdocprovidestore) and [askEventDocProvideStoreFromGlobals](#askeventdocprovidestorefromglobals) delegate to it once they have assembled the full store object; call it directly only when you already hold an `EventDocStore`.

### Signature

```typescript
function* askEventDocStoreProvide<T>(
  store: EventDocStore,
  story: AskResponse<T>,
): AskResponse<T>;
```

## askEventDocStoreRead

The raw context **reader**: returns the currently bound [`EventDocStore`](#eventdocstore--the-binding). Built with `createContextReader`. Outside a provider it returns the **empty default** (blank `storeName` / `type`) rather than throwing — so most callers should prefer [askEventDocResolveStore](#askeventdocresolvestore). Internal data stories that only need one field (e.g. `scopeResolver`) read it directly.

### Signature

```typescript
function* askEventDocStoreRead(): AskResponse<EventDocStore>;
```

## askEventDocResolveStore

Reads the store context and **throws if it was not provided** — a plain read otherwise silently returns the empty default and the data stories would target a blank store. This is the safe accessor the event/asset data stories use to get the store; it validates that `storeName` and `type` are set.

```typescript
import { askEventDocResolveStore } from '@qpqjs/features';

export function* eventsStoreName() {
  const { eventsStoreName } = yield* askEventDocResolveStore();
  return eventsStoreName;
}
```

### Signature

```typescript
function* askEventDocResolveStore(): AskResponse<EventDocStore>;
```

### Returns

`AskResponse<EventDocStore>` — the bound store binding.

### Notes

- Throws `ErrorTypeEnum.GenericError` when `storeName` or `type` is missing, with the message: *"EventDoc store context was not provided. Wrap the call in askEventDocStoreProvide(...)"*.

## Related

- [askContextProvideValue](../../core/context/ask-context-provide-value.md) / [askContextRead](../../core/context/ask-context-read.md) — the core context system this specialises.
- [askConfigGetGlobal](../../core/config/ask-config-get-global.md) — reads the per-route globals `askEventDocProvideStoreFromGlobals` bridges.
- [askEventDocEventAppend](./ask-event-doc-event-append.md) · [event readers](./ask-event-doc-event-list.md) · [asset helpers](./ask-event-doc-generate-asset-upload-url.md) — the data stories that require this context.
- [askEventDocResolveActor / ResolveUserId / ParseBody](./ask-event-doc-resolve-actor.md) — the other request-time helpers used in controllers.
