import { Nullable } from 'quidproquo-core';

import { EventDocEvent, EventDocLink, EventDocSnapshotViews, EventDocSummaryView } from '../../models';
import { EventDocWorkspaceDocumentSlotConfig } from '../../workspace/types/EventDocWorkspaceDocumentSlotConfig';
import { EventDocWorkspaceLocalSlotConfig } from '../../workspace/types/EventDocWorkspaceLocalSlotConfig';
import { EventDocWorkspaceStoryApi } from '../../workspace/types/EventDocWorkspaceStoryApi';
import { EventDocGenericApi } from '../eventDocGenericApi';
import { EventDocLatestViews, EventDocPrimaryView, EventDocSummaryViewName } from './EventDocLatestViews';
import { EventDocReferenceCollector } from './EventDocReferenceCollector';
import { EventDocVersions } from './EventDocVersion';

/** One projection of a doc type's log. `fold` is the only way to read it, so every reader of a log agrees on what it says. */
export type EventDocView<TView> = {
  fold: (events: EventDocEvent[]) => TView;
};

/**
 * The canonical home of a saved doc type: its versions folded into one view per projection, plus its api (with the
 * generic lifecycle verbs merged in). Structurally a workspace slot config that mounts the primary (`document`) view.
 */
export type EventDocDefinition<TVersions extends EventDocVersions, TApi extends EventDocWorkspaceStoryApi> = EventDocWorkspaceDocumentSlotConfig<
  EventDocPrimaryView<TVersions>,
  TApi & EventDocGenericApi
> & {
  // Present on a doc type registered as a backend collection; absent on client-only definitions.
  storeName?: string;
  type?: string;

  // Every projection, typed at the latest version. `summary` is built in: it folds only the reserved lifecycle events.
  views: {
    [K in keyof EventDocLatestViews<TVersions>]: EventDocView<EventDocLatestViews<TVersions>[K]>;
  } & Record<EventDocSummaryViewName, EventDocView<EventDocSummaryView>>;

  references?: EventDocReferenceCollector<EventDocPrimaryView<TVersions>>;

  // Every doc this one has ever referenced across its whole log (the transfer export's walk); [] for a leaf doc type.
  collectReferences: (events: EventDocEvent[]) => EventDocLink[];

  // What the current document references, from an already-folded latest-shaped state.
  collectReferencesFromState: (state: unknown) => EventDocLink[];

  // The document view at one point, latest-shaped. `seedState` must be an era-pinned snapshot state, never a pre-migrated one.
  foldDocumentState: (events: EventDocEvent[], seedState?: unknown) => unknown;

  // The pre-write gate the append path runs against the head state (same registry as the fold and the editor).
  validateEvent: (event: EventDocEvent, state: unknown) => Nullable<string>;

  // Every view of the log prefix in one pass, era-pinned (no climb to latest): what a snapshot stores. With `seedViews`,
  // `events` is only the gap since that snapshot. Null means the seed lacks a current view; fold from scratch instead.
  foldSnapshotViews: (events: EventDocEvent[], seedViews?: EventDocSnapshotViews) => Nullable<EventDocSnapshotViews>;
};

/** An unsaved doc has no server log, so nothing to fold: it is its slot config. */
export type EventDocUnsavedDefinition<TView, TApi extends EventDocWorkspaceStoryApi> = EventDocWorkspaceLocalSlotConfig<TView, TApi>;
