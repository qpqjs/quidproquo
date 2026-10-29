import { askPagedDataDrain, AskResponse } from '@qpqjs/core';

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

  if (!firstPage.nextPageKey) {
    return { base: firstPage.base, events: firstPage.items };
  }

  const tail = yield* askPagedDataDrain(
    function* askEventsPage(nextPageKey) {
      return yield* askEventDocWorkspaceApiFetchEventsPage(identity, { nextPageKey, afterEventId: firstPage.base?.eventId });
    },
    { startPageKey: firstPage.nextPageKey },
  );

  return { base: firstPage.base, events: [...firstPage.items, ...tail.items] };
}
