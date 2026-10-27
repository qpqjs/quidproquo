---
title: Event doc workspace sync
description: Keep an open event-doc workspace in step with other writers over the WebSocket queue, and keep its held history from growing.
---

# Event doc workspace sync

A workspace holds a document as a fold base plus the saved events after it. Left alone, that history grows for as long as the editor stays open, and nothing tells the editor when someone else (another user, a server-side flow such as a signing step) appends to the same document. Live sync fixes both:

- **Compaction.** After every server-sourced write to a slot (a save ack, a tail pull, a bootstrap) the workspace moves the base up to the last held event and empties the history, so at rest a slot holds the state at head and nothing else. The stored fold is already that state, so no refold happens. This is on for every workspace, with no setup.
- **Pushes.** A collection with the `sync` option sends a small `EventDocHeadMoved` message over a WebSocket queue after every append. A subscribed workspace answers with a tail pull of just the new events, or a full resync from the bootstrap if the tail does not follow what it holds.

The push carries ids only, never the document state: `storeName`, `type`, `docId`, `headEventId`, and the `clientMessageId` of the event that moved the head.

## Setting it up

Three things, in order: the queue, the collection, the editor.

### 1. A WebSocket queue the service can reach

Any [defineWebSocketQueue](./web-socket-queue.md); in a tenanted app, [defineTenantedWebSocketQueue](./tenanted-web-socket-queue.md), which refuses a subscription to a document the connection's tenant membership cannot read. The queue can be owned by another module, as long as this service references it.

### 2. `sync` on the definition

```typescript
export const envelopeEventDoc = createEventDocDefinition({
  storeName: 'envelopes',
  type: 'envelope',
  sync: { websocketApiName: 'ws' },
  // ...
});
```

The definition is what both the built-in routes (through `defineEventDoc` / `defineTenantedEventDoc`) and a service-side `createEventDocBackend` read, so one setting covers client-authored appends and the server-authored ones a signing step or a build worker makes. A hand-mounted `defineEventDocRoutes` can still take `sync` directly, and an explicit routes option wins over the definition's.

`websocketApiName` also takes a list, for a collection whose readers sit on more than one queue (an admin viewer on the tenant queue and a public page on a queue of its own); every queue gets the same push.

Every append through that collection, client-authored or server-authored, then pushes under the append's storage scope. Only connections validated into the same scope receive it. The push is best-effort and runs after the hooks: a failed push never fails the append.

### 3. The slot and the hook in the editor

A document slot opts in by naming its collection's store:

```typescript
const workspace = createEventDocWorkspace({
  slots: {
    envelope: {
      kind: EventDocWorkspaceSlotKind.document,
      storeName: 'envelopes',
      // foldReducer, createInitialViewState, api, ...
    },
  },
  transport,
});
```

`workspace.storeNames` then lists the slots that opted in. A slot built from `createEventDocDefinition` with `storeName` and `type` set already carries it, so nothing extra is needed there. The identity a slot is bound to only carries the wire address (`serviceName`, `basePath`, `id`), and the push topic needs the store name, which is why the slot config declares it.

Mount the hook from `@qpqjs/web-react` once per editor, below `WebsocketProvider` and `WebSocketAuthSync`:

```typescript
import { useEventDocWorkspaceSync } from '@qpqjs/web-react';

const [api, state] = useQpqRuntime(runtime, runtimeName);

useEventDocWorkspaceSync(workspace.storeNames, state, api);
```

`api` needs two of the workspace's built-in verbs, `syncHeadMoved` and `refresh` (the mapped names of `askSyncHeadMoved` and `askRefresh`). An editor that merges the workspace api into a larger one must expose those two; the `EventDocWorkspaceSyncApi` type names them.

## What the hook does

- For every opted-in slot with a bound identity it sends `Subscribe { topic: 'eventDoc#<store>#<docId>' }` as soon as the connection is authenticated, `Unsubscribe` when the slot rebinds to another document, and `Unsubscribe` on unmount while the socket is open.
- Subscriptions live on the server connection, and the server drops them all on every authenticate. So every `Authenticated` message (first open, a reconnect, a tenant switch) makes the hook subscribe again, and after a re-authentication it tail-pulls each slot to cover pushes missed while away. A slot still loading its bootstrap is not pulled; the bootstrap lands current.
- A head-moved push is mapped back to a slot by store name and document id and handed to `askSyncHeadMoved`.

### A page that is not a workspace

A page that reads a document through its own api (a public signing page that GETs a view, say) can still follow pushes with `useEventDocHeadMovedSubscription`:

```typescript
import { useEventDocHeadMovedSubscription } from '@qpqjs/web-react';

useEventDocHeadMovedSubscription('envelopes', envelopeId, api.refresh);
```

It subscribes to that one document once authenticated, again on every `Authenticated`, and calls back with the push payload for pushes about that document only. A null id follows nothing.

## What `askSyncHeadMoved` does

Nothing, when the push is one of:

- a head the slot already holds;
- the slot's own save: the push names a `clientMessageId` still pending in the slot, so the save ack is about to bring the event in;
- a slot that is saving, where the ack's own contiguity check catches anything another writer landed.

Otherwise a tail pull from the held head. A tail that follows the head is appended and compacted; a tail with a gap triggers a resync, which replaces base and history from the bootstrap and compacts. Both paths then rebase the slot's pending events, as described next.

## Unsaved edits after a pull

A pull can change what the document allows. The common case is another writer publishing: every edit still unsaved here was made against a draft and would now be rejected by the server's append gate, so holding on to it only delays the failure to save time.

After every pull or resync (and never after the slot's own save ack) the workspace re-runs the slot's validator over the pending buffer in order, each event against the new state plus the events kept before it, exactly as its original commit was judged. Events that still apply stay pending in their original order. Events that no longer apply are dropped, and the slot error is set with operation `rebase` and a message such as:

```
2 unsaved changes were discarded because the document changed: Create a draft first, the document is published.
```

The message clears the same way other slot errors do: on the next successful commit, on Cancel, or at the start of the next pull. A slot with no validator (a local slot without `validate`) never drops anything. `rebaseSlotPending` is exported for code that wants the verdict without the state change.

## Notes

- The push does not replay. Anything missed while disconnected is covered by the tail pull after the next `Authenticated`.
- `api.askResync(slotKey?)` is also available to call by hand, for a "reload from server" control.
- Pending events are rebased, not merged. An edit that still validates is kept as is, even if it now overwrites something another writer changed.

## Related

- [defineEventDocRoutes](./event-doc-routes.md): the `sync` option.
- [defineWebSocketQueue](./web-socket-queue.md#topic-subscriptions): how topic subscriptions and `askWebSocketQueueSendToTopic` work.
- [defineTenantedWebSocketQueue](./tenanted-web-socket-queue.md): the tenant read check on subscriptions.
