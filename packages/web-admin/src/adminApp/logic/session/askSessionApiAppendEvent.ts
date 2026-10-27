import { AskResponse } from 'quidproquo-core';
import { EventDocEvent, EventDocEventInput } from 'quidproquo-features';

import { adminSessionApiBasePath } from '../../constants/adminSessionApiBasePath';
import { askSessionApiRequestOrThrow } from './askSessionApiRequestOrThrow';

// POST /v1/admin/session/{id}/events — the backend dedups by clientMessageId,
// enforces version monotonicity, and stamps createdBy/createdAt/index.
export function* askSessionApiAppendEvent(docId: string, input: EventDocEventInput): AskResponse<EventDocEvent> {
  return yield* askSessionApiRequestOrThrow<EventDocEventInput, EventDocEvent>('POST', `${adminSessionApiBasePath}/${docId}/events`, input);
}
