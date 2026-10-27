import { AskResponse, Nullable } from 'quidproquo-core';

import { askEventDocEventLast } from '../data/askEventDocEventLast';
import { EventDocDocumentStateAtEvent } from '../models';
import { askEventDocDocumentStateAsOf, EventDocDocumentStateAsOfOptions } from './askEventDocDocumentStateAsOf';

/**
 * The document state at the log's head. Null for a document with no events.
 * consistentRead applies to the head resolve as well as the gap read: a stale head silently truncates the log.
 */
export function* askEventDocDocumentStateLatest(
  modelId: string,
  options?: EventDocDocumentStateAsOfOptions,
): AskResponse<Nullable<EventDocDocumentStateAtEvent>> {
  const head = yield* askEventDocEventLast(modelId, { consistentRead: options?.consistentRead });

  if (!head) {
    return null;
  }

  return yield* askEventDocDocumentStateAsOf(modelId, head.payload.metadata.eventId, options);
}
