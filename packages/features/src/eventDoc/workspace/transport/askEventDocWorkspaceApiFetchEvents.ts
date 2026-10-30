import { askPagedDataDrain, AskResponse } from '@qpqjs/core';

import { EventDocEvent } from '../../models';
import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';
import { askEventDocWorkspaceApiFetchEventsPage } from './askEventDocWorkspaceApiFetchEventsPage';

/** Fetches a document's events across pages; with afterEventId (exclusive) only the tail. */
export function* askEventDocWorkspaceApiFetchEvents(
  identity: EventDocWorkspaceDocumentIdentity,
  afterEventId?: number,
): AskResponse<EventDocEvent[]> {
  const { items } = yield* askPagedDataDrain(function* askEventsPage(nextPageKey) {
    return yield* askEventDocWorkspaceApiFetchEventsPage(identity, { nextPageKey, afterEventId });
  });

  return items;
}
