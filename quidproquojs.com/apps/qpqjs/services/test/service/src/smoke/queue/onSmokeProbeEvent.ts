import {
  askKeyValueStoreUpsert,
  AskResponse,
  QueueEventResponse,
} from 'quidproquo';

import { SMOKE_PROBE_STORE } from '@qpqjs/constants';
import { SmokeProbeRecord } from '@qpqjs/test-models';

import { SmokeProbeEventQueueEvent } from '../models/SmokeProbeEventQueueEvent';

// Fan-in for the event bus test: the message published to the probe bus
// lands here via the subscribed queue, and the marker row it writes is what
// the test polls for.
export function* onSmokeProbeEvent(
  event: SmokeProbeEventQueueEvent
): AskResponse<QueueEventResponse> {
  const marker: SmokeProbeRecord = {
    probeId: event.message.payload.markerId,
    category: 'eventBus',
    value: 1,
  };

  yield* askKeyValueStoreUpsert<SmokeProbeRecord>(SMOKE_PROBE_STORE, marker);

  return true;
}
