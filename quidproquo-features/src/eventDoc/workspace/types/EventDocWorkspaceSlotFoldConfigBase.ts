import { QpqReducer } from 'quidproquo-core';

import { EventDocEvent } from '../../models';
import { EventDocEditorValidator } from '../../validation';

/** The api-free part of a slot config: everything the selectors, reducer and initial state need. */
export type EventDocWorkspaceSlotFoldConfigBase<TView> = {
  // Domain reducers are cast to EventDocEvent at this boundary.
  foldReducer: QpqReducer<TView, EventDocEvent>;
  createInitialViewState: () => TView;
  // Stamped on every committed event and the fold target for document slots. Defaults to 1.
  schemaVersion?: number;
  // Runs against the slot's live state before a commit lands. Document slots default to the lifecycle guard, local slots to accept-all.
  validate?: EventDocEditorValidator;
};
