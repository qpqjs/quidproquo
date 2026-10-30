import { askPagedDataDrain, AskResponse, QpqPagedData } from '@qpqjs/core';
import { EventDocEvent } from '@qpqjs/features';

import { adminSessionApiBasePath } from '../../constants/adminSessionApiBasePath';
import { askSessionApiRequestOrThrow } from './askSessionApiRequestOrThrow';

// GET /v1/admin/session/{id}/events, the full ordered log (paged).
export function* askSessionApiListAllEvents(docId: string): AskResponse<EventDocEvent[]> {
  const { items } = yield* askPagedDataDrain(function* askEventsPage(nextPageKey) {
    const query = nextPageKey ? `?nextPageKey=${encodeURIComponent(nextPageKey)}` : '';

    return yield* askSessionApiRequestOrThrow<QpqPagedData<EventDocEvent>, undefined>('GET', `${adminSessionApiBasePath}/${docId}/events${query}`);
  });

  return items;
}
