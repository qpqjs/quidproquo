import { askQueueSendMessages, AskResponse } from '@qpqjs/core';

import { eventDocReprojectQueueName } from '../constants/eventDocReprojectQueueName';
import { EventDocReprojectMessageType, EventDocReprojectSource, EventDocReprojectWalkPayload } from '../models';

/**
 * Start (or continue) a reproject walk of one collection's store: queue the walk message its reproject queue picks up.
 * Returns once the message is queued; the walk itself runs a page at a time on the queue.
 */
export function* askEventDocReprojectStart(storeName: string, source: EventDocReprojectSource, nextPageKey?: string): AskResponse<void> {
  const payload: EventDocReprojectWalkPayload = { source, nextPageKey };

  yield* askQueueSendMessages(eventDocReprojectQueueName(storeName), { type: EventDocReprojectMessageType.Walk, payload });
}
