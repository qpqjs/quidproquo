import { AskResponse, Nullable } from '@qpqjs/core';

import { EventDocEvent, EventDocLink, EventDocListViewState, EventDocRenderInput, EventDocRenderResult, EventDocSnapshotViews } from '../../models';
import { EventDocSyncOptions } from '../../types/EventDocSyncOptions';

/**
 * The callable surface a collection registers via defineDynamicFunctions. A saved EventDocDefinition satisfies it
 * structurally; extendEventDocFunctions adds service-side members like render.
 */
export type EventDocFunctions = {
  storeName?: string;
  type?: string;
  // The websocket queue head-moved pushes go out on; read by the routes and by createEventDocBackend.
  sync?: EventDocSyncOptions;

  // The snapshot cache key the collection's snapshots are filed under (see EventDocSavedDefinitionConfig.snapshotCacheKey).
  // A member rather than a value because the data layer reaches a definition only through dynamic functions.
  getSnapshotCacheKey: () => string;

  // The event types only server code may append; the client append path refuses them. Absent reads as none.
  getServerEventTypes?: () => string[];

  // The views kept as rows in the lists store, `summary` among them. Absent reads as the summary alone.
  getListViewNames?: () => string[];

  // One list view's state after `events`, resumed from a stored row's state. Null when it cannot be folded from the
  // view alone (see EventDocDefinition.foldListView). Invoked by the append path. Absent folds the summary alone.
  foldListView?: (viewName: string, events: EventDocEvent[], seedState: unknown, trusted: boolean) => Nullable<EventDocListViewState>;

  // Stored list view states climbed to the latest schema. Invoked by the list route. Absent leaves them as stored.
  migrateListViewStates?: (viewName: string, states: unknown[]) => unknown[];

  // Every view of the log prefix, era-pinned: what a snapshot stores. Invoked by the event store's stream projector.
  foldSnapshotViews: (events: EventDocEvent[], seedViews?: EventDocSnapshotViews) => Nullable<EventDocSnapshotViews>;

  // Every link the whole log has ever depended on; [] for a leaf doc type. Invoked by the transfer manifest walk.
  collectReferences: (events: EventDocEvent[]) => EventDocLink[];

  // Links the current state depends on; [] for a leaf doc type. Invoked by the references route.
  collectReferencesFromState: (state: unknown) => EventDocLink[];

  // The document at one point, latest-shaped, resumable from a snapshot's era-pinned document state.
  foldDocumentState: (events: EventDocEvent[], seedState?: unknown) => unknown;

  // Fold and render the resolved log. Optional: without it the render route 404s. Plain function or story.
  render?: (input: EventDocRenderInput) => EventDocRenderResult | AskResponse<EventDocRenderResult>;

  // The pre-write gate: the append path runs it against the document's head state and a non-null reason rejects the
  // append, so the event never enters the log. The fold's acceptance is defence in depth behind it. May be a story.
  // Required: a collection with no rules registers defaultEventDocEventValidator rather than leaving the gate to guess.
  validateEvent: (event: EventDocEvent, state: unknown) => Nullable<string> | AskResponse<Nullable<string>>;
};
