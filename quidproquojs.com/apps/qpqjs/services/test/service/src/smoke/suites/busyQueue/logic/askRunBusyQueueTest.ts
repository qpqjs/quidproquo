import { askGuidNew, askQueueSendMessages, AskResponse, QueueMessage } from 'quidproquo';

import { askSmokePollForMarker } from '../../../harness/assert/askSmokePollForMarker';
import { SMOKE_BUSY_QUEUE } from '../constants/SMOKE_BUSY_QUEUE';
import { SMOKE_BUSY_QUEUE_BURST_SIZE } from '../constants/SMOKE_BUSY_QUEUE_BURST_SIZE';
import { SMOKE_BUSY_QUEUE_MESSAGE_TYPE } from '../constants/SMOKE_BUSY_QUEUE_MESSAGE_TYPE';
import { SmokeBusyQueuePayload } from '../models/SmokeBusyQueueEvent';

// Long enough for the whole burst when only one message gets through per round: a round is the
// queue's retry delay, and there is one round per message.
const POLL_ATTEMPTS = 45;

/**
 * A burst to a queue whose consumer may only run one at a time: every message must still be
 * handled. The first message occupies the consumer and the rest arrive while it is busy. A
 * provider that hands a message over and then cannot run the consumer counts that as a try, so
 * with a single try those messages go to the dead letter queue without their handler ever
 * running, and their markers never arrive. Locally the queue just runs them one after another.
 */
export function* askRunBusyQueueTest(): AskResponse<void> {
  const markerIds: string[] = [];
  for (let index = 0; index < SMOKE_BUSY_QUEUE_BURST_SIZE; index += 1) {
    markerIds.push(yield* askGuidNew());
  }

  const messages = markerIds.map((markerId): QueueMessage<SmokeBusyQueuePayload> => ({
    type: SMOKE_BUSY_QUEUE_MESSAGE_TYPE,
    payload: { markerId },
  }));

  yield* askQueueSendMessages(SMOKE_BUSY_QUEUE, ...messages);

  for (const markerId of markerIds) {
    yield* askSmokePollForMarker(markerId, 'the busy queue (a message that arrived while its one consumer was busy was lost)', POLL_ATTEMPTS);
  }
}
