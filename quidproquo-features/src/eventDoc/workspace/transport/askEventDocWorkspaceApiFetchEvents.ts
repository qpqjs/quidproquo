import { AskResponse } from 'quidproquo-core';

import { EventDocEvent } from '../../models';
import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';
import { askEventDocWorkspaceApiFetchEventsPage } from './askEventDocWorkspaceApiFetchEventsPage';

/** Fetches a document's events across pages; with afterEventId (exclusive) only the tail. */
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
