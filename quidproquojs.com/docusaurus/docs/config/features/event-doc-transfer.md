---
title: defineEventDocTransfer
description: Mount export/import routes that move event-doc collections between environments as portable bundles.
---

# defineEventDocTransfer

Mounts the export/import **routes** for a service's event-doc collections: a staging storage drive plus five routes that build, stage, plan, and apply portable bundles of one or more documents (and everything they reference). It returns a `QPQConfig` (an array of config settings) that you spread into a service's infrastructure default export, alongside its `defineEventDoc` calls.

An export walks a doc's registered functions object `collectReferences` (see [defineEventDoc](./event-doc.md)) to pull in every doc it depends on — a template's layout, styles, and content — so a bundle is self-contained. An import replays that bundle's event log against the target's own collections, either as a fresh doc or appended onto one that already exists there, and reports what it would do (or did) per document.

The route controllers ship inside `quidproquo-features` and read the collection registry from per-route globals, so a service needs no controller wiring of its own.

- **On AWS:** deploys a storage drive for staged bundle files and the routes below, each backed by a Lambda running the corresponding built-in controller. It creates no data infrastructure for the collections themselves — those come from each collection's own `defineEventDoc`/`defineEventDocSummary`.

```typescript
import { defineEventDoc, defineEventDocTransfer } from 'quidproquo-features';
import { articleDefinition } from './articleDefinition';
import { templateDefinition } from './templateDefinition';

const collections = [templateDefinition, articleDefinition];

export default [
  ...defineEventDoc(templateDefinition, '/entry/eventDocs::templateDefinition', { basePath: '/templates' }),
  ...defineEventDoc(articleDefinition, '/entry/eventDocs::articleDefinition', { basePath: '/articles' }),

  ...defineEventDocTransfer({
    service: 'cms',
    collections,
    routeAuthSettings: { userDirectoryName: 'editors' },
  }),
];
```

## Routes mounted

All paths are prefixed with the version segment `/v{version}` (default `/v1`):

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/transfer/manifest` | Every doc that would travel with a given `{ docs: [{ service, type, id }, ...] }` selection, merged and deduped across all of them (follows each collection's `collectReferences` links), without building anything. Feeds an export UI's "these will be included" preview. |
| `POST` | `/transfer/export` | Stage one bundle for `{ docs: [...] }` and return its download url. |
| `POST` | `/transfer/upload` | A presigned PUT url for uploading a bundle file, plus the id used to plan/import it. |
| `POST` | `/transfer/plan` | What importing an uploaded bundle (`{ transferId }`) would do to each of its docs (`new`, `fastForward`, `same`, or a blocking `diverged`/`codeConflict`) without writing anything. |
| `POST` | `/transfer/import` | Apply an uploaded bundle (`{ transferId, force? }`) and report what happened per doc. `force` opts into overwriting docs the target has edited directly (the divergent tail is backed up to the transfer drive and discarded); off unless the caller asks for it explicitly. |

### Server-only event types

An import replays the bundle's log verbatim (apart from re-attributing `createdBy.userId` to the importer); it does not go through the client append path, so a collection's [server-only event types](./event-doc.md#server-only-event-types) travel with the document. That is deliberate: a bundle is a copy of a log that was gated when it was written, and the import route is an operator action behind the transfer's own auth, not a user editing a document. Stripping them would turn a promoted script into one whose build never happened.

## Signature

```typescript
function defineEventDocTransfer(options: EventDocTransferOptions): QPQConfig;
```

## Parameters

The single `options` argument is an `EventDocTransferOptions`:

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `service` | `string` | – (required) | The service name `EventDocLink`s use to address this service's collections (`link.eventDocService`). Transfers never leave it: the stores live here, so a reference into another service throws rather than being silently dropped from a manifest. |
| `collections` | `EventDocTransferCollectionSource[]` | – (required) | The collections a transfer may read and write. Feed this the same array the service maps into its `defineEventDoc` calls (each entry's functions object carries the identity), so the two cannot drift — see `EventDocTransferCollectionSource` below. |
| `scopeResolver` | `string` | – | Name of a registered inline function. Establishes the ambient storage scope for the whole request, exactly like a collection's own `scopeResolver`. Needed separately because a transfer spans collections, so there is no single store to read the resolver name from. Omit only if none of the collections partition. |
| `routeAuthSettings` | `RouteAuthSettings` | – | Auth settings applied to every mounted route (from quidproquo-webserver — see [route](../webserver/route.md)). Import writes unvalidated history and export reads across every registered collection, so gate these harder than the collections' own routes. |
| `version` | `number` | `1` | Version number for the `/v{version}` path prefix on every route. |

### `EventDocTransferCollectionSource`

Each `collections` entry can be any of:

- An `EventDocFunctions` object — the same value passed as `defineEventDoc`'s `functions` argument. Its `collectReferences` drives the manifest walk; `storeName`/`type` are read off it.
- A collection-list entry carrying its functions object under `functions` (`{ functions, ... }`) — so the exact array a service maps over for its `defineEventDoc` calls passes straight through, unmapped.
- A bare `EventDocTransferCollection` registry entry (`{ storeName, type, onPublish?, onAppend? }`), for a collection that needs the import hooks carried explicitly without passing a live functions object.

`onPublish`/`onAppend` are carried so an imported publish/append behaves exactly as it does on the collection's own routes. Fold-gate validation is deliberately **not** applied to imported events — replayed history was already validated at its origin.

## Related

- [defineEventDoc](./event-doc.md) / [defineEventDocRoutes](./event-doc-routes.md) — declare the collections a transfer reads and writes, including the functions object (`collectReferences`) the manifest walk follows.
- [defineTenantedEventDocTransfer](./tenanted-event-doc-transfer.md) — the same routes with the tenant scope resolver pre-wired, so export/import never cross tenant partitions.
