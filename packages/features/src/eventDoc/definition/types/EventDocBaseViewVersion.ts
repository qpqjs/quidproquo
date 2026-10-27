import { QpqReducer } from 'quidproquo-core';

import { EventDocDocument, EventDocEvent } from '../../models';

/**
 * A view at the base version: it has a seed and no predecessor. Only the base seeds; every log opens with an INIT_STATE
 * at version 1, so a document created under a later schema starts at the base shape and climbs the migration chain.
 */
export type EventDocBaseViewVersion<TView extends EventDocDocument = EventDocDocument> = {
  // Domain reducers are typed to their own effect union and cast to EventDocEvent at this boundary.
  foldReducer: QpqReducer<TView, EventDocEvent>;
  createInitialViewState: () => TView;
};
