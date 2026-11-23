import { SMOKE_PROBE_STORE } from '@qpqjs/constants';
import { SmokeProbeRecord } from '@qpqjs/test-models';
import { askKeyValueStoreUpsert, askPlatformDelay, AskResponse, QueueEventResponse } from 'quidproquo';

import { SMOKE_BUSY_QUEUE_WORK_MS } from '../../constants/SMOKE_BUSY_QUEUE_WORK_MS';
import { SmokeBusyQueueEvent } from '../../models/SmokeBusyQueueEvent';

/**
 * The busy queue's one consumer: holds each message for a while, so the rest of a burst arrives
 * while it is busy, then writes the marker the test polls for.
 */
export function* onSmokeBusyQueueMessage(event: SmokeBusyQueueEvent): AskResponse<QueueEventResponse> {
  yield* askPlatformDelay(SMOKE_BUSY_QUEUE_WORK_MS);

  const marker: SmokeProbeRecord = {
    probeId: event.message.payload.markerId,
    category: 'busyQueue',
    value: 1,
  };

  yield* askKeyValueStoreUpsert<SmokeProbeRecord>(SMOKE_PROBE_STORE, marker);

  return true;
}
