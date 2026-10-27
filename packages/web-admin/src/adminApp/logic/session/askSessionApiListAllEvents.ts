import { AskResponse, QpqPagedData } from 'quidproquo-core';
import { EventDocEvent } from 'quidproquo-features';

import { adminSessionApiBasePath } from '../../constants/adminSessionApiBasePath';
import { askSessionApiRequestOrThrow } from './askSessionApiRequestOrThrow';

// GET /v1/admin/session/{id}/events — the full ordered log (paged).
export function* askSessionApiListAllEvents(docId: string): AskResponse<EventDocEvent[]> {
  const events: EventDocEvent[] = [];
  let nextPageKey: string | undefined = undefined;

  do {
    const query = nextPageKey ? `?nextPageKey=${encodeURIComponent(nextPageKey)}` : '';
    const page: QpqPagedData<EventDocEvent> = yield* askSessionApiRequestOrThrow<undefined, QpqPagedData<EventDocEvent>>(
      'GET',
      `${adminSessionApiBasePath}/${docId}/events${query}`,
    );

    events.push(...page.items);
    nextPageKey = page.nextPageKey;
  } while (nextPageKey);

  return events;
}
