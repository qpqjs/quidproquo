import { AskResponse } from 'quidproquo-core';

import { EventDocEvent } from '../../models';
import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';
import { askEventDocWorkspaceApiFetchEventsPage } from './askEventDocWorkspaceApiFetchEventsPage';

// Fetches a document's event log, following pagination in order. With `afterEventId` it
// fetches only the tail (events after that log index); without it, the full log.
// This is the EventDocWorkspaceTransport.askFetchEvents shape.
export function* askEventDocWorkspaceApiFetchEvents(
  identity: EventDocWorkspaceDocumentIdentity,
  afterEventId?: number,
): AskResponse<EventDocEvent[]> {
  const all: EventDocEvent[] = [];
  let nextPageKey: string | undefined;

  do {
    const page = yield* askEventDocWorkspaceApiFetchEventsPage(identity, { nextPageKey, afterEventId });
    all.push(...page.items);
    nextPageKey = page.nextPageKey;
  } while (nextPageKey);

  return all;
}
