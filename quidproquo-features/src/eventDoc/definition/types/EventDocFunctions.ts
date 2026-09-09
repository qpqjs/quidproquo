import { AskResponse, Nullable } from 'quidproquo-core';

import { EventDocEvent, EventDocLink, EventDocRenderInput, EventDocRenderResult, EventDocSnapshotViews } from '../../models';

/**
 * The callable surface a collection registers via defineDynamicFunctions. A saved EventDocDefinition satisfies it
 * structurally; extendEventDocFunctions adds service-side members like render.
 */
export type EventDocFunctions = {
  storeName?: string;
  type?: string;

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
  validateEvent?: (event: EventDocEvent, state: unknown) => Nullable<string> | AskResponse<Nullable<string>>;
};
