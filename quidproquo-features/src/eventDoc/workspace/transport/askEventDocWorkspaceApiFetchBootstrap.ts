import { AskResponse } from 'quidproquo-core';

import { EventDocEvent } from '../../models';
import { EventDocWorkspaceBootstrap } from '../types/EventDocWorkspaceBootstrap';
import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';
import { askEventDocWorkspaceApiFetchBootstrapPage } from './askEventDocWorkspaceApiFetchBootstrapPage';
import { askEventDocWorkspaceApiFetchEventsPage } from './askEventDocWorkspaceApiFetchEventsPage';

/**
 * Opening load: the newest snapshot base plus the events after it, across pages. Follow-up pages pin afterEventId to the
 * base so a snapshot written mid-load cannot shift the page boundaries.
 */
export function* askEventDocWorkspaceApiFetchBootstrap(identity: EventDocWorkspaceDocumentIdentity): AskResponse<EventDocWorkspaceBootstrap> {
  const firstPage = yield* askEventDocWorkspaceApiFetchBootstrapPage(identity);

  const events: EventDocEvent[] = [...firstPage.items];
  let nextPageKey = firstPage.nextPageKey;

  while (nextPageKey) {
    const page = yield* askEventDocWorkspaceApiFetchEventsPage(identity, { nextPageKey, afterEventId: firstPage.base?.eventId });
    events.push(...page.items);
    nextPageKey = page.nextPageKey;
  }

  return { base: firstPage.base, events };
}
