import { QpqReducer } from 'quidproquo-core';

import { EventDocEvent } from '../../models';
import { EventDocEventValidators } from '../../validation/types/EventDocEventValidators';
import { CoalesceEventType } from '../../workspace/types/CoalesceEventType';
import { EventDocWorkspaceStoryApi } from '../../workspace/types/EventDocWorkspaceStoryApi';
import { EventDocPrimaryView } from './EventDocLatestViews';
import { EventDocReferenceCollector } from './EventDocReferenceCollector';
import { EventDocVersions } from './EventDocVersion';

/** Config for a saved doc: a persisted, versioned log with a draft/published lifecycle. Omit `saved` (or pass true). */
export type EventDocSavedDefinitionConfig<TVersions extends EventDocVersions, TApi extends EventDocWorkspaceStoryApi> = {
  saved?: true;

  // The collection's identity. Set both for a backend collection, neither for client-only definitions; one without the other throws.
  storeName?: string;
  type?: string;

  // Stamped on every event the doc authors and the fold's migration target. Must equal the last entry in `versions`.
  schemaVersion: number;

  // Oldest first. The head seeds; each tail entry migrates from the one before it.
  versions: TVersions;

  // Merged after the reserved rules (SET_CODE/SET_NAME coalesce; lifecycle events never do). Unlisted types append.
  coalesceEventTypes?: CoalesceEventType[];

  // Domain rules keyed by event type; the reserved lifecycle guard is always merged in. One registry per doc type, never
  // per view: the primary view is the acceptance gate. The append gate and the editor pre-flight derive from these same rules.
  validators?: EventDocEventValidators<EventDocPrimaryView<TVersions>>;

  // The other docs this one depends on, read off the folded primary view. Omit for a leaf doc type.
  references?: EventDocReferenceCollector<EventDocPrimaryView<TVersions>>;

  // The doc's own verbs: own-doc writes and reads only, workspace-blind. Cross-doc flows belong to the editor api layer.
  api: TApi;
};

/**
 * Config for an unsaved doc (experience, chrome): the same fold machinery over a session-only stream, with no
 * persistence, versions or lifecycle.
 */
export type EventDocUnsavedDefinitionConfig<TView, TApi extends EventDocWorkspaceStoryApi> = {
  saved: false;
  foldReducer: QpqReducer<TView, EventDocEvent>;
  createInitialViewState: () => TView;
  // Omitted = last-write-wins for every type. An explicit list opts unlisted types back into append semantics.
  coalesceEventTypes?: CoalesceEventType[];
  api: TApi;
};
