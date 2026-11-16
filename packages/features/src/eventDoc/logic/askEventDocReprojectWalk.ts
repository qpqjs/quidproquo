import { askQueueSendMessages, AskResponse } from '@qpqjs/core';

import { eventDocReprojectQueueName } from '../constants/eventDocReprojectQueueName';
import { askEventDocReprojectTargetsPage } from '../data/askEventDocReprojectTargetsPage';
import { EventDocReprojectMessageType, EventDocReprojectWalkPayload } from '../models';
import { askEventDocReprojectStart } from './askEventDocReprojectStart';

/**
 * One step of a reproject walk: read a page of the documents `storeName` holds, queue one reproject message per
 * document, then queue the next step when there is more to read. Each step reads one page, so a walk of any size is a
 * run of short invocations. Returns how many documents this step queued.
 */
export function* askEventDocReprojectWalk(storeName: string, { source, nextPageKey }: EventDocReprojectWalkPayload): AskResponse<number> {
  const page = yield* askEventDocReprojectTargetsPage(storeName, source, nextPageKey);

  if (page.items.length > 0) {
    yield* askQueueSendMessages(
      eventDocReprojectQueueName(storeName),
      ...page.items.map((target) => ({ type: EventDocReprojectMessageType.Document, payload: target })),
    );
  }

  if (page.nextPageKey) {
    yield* askEventDocReprojectStart(storeName, source, page.nextPageKey);
  }

  return page.items.length;
}
