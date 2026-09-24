import {
  askEventBusSendMessages,
  askNewGuid,
  AskResponse,
  EventBusMessage,
} from 'quidproquo';

import { askSmokePollForMarker } from '../../../harness/assert/askSmokePollForMarker';
import { SMOKE_PROBE_EVENT_BUS } from '../constants/SMOKE_PROBE_EVENT_BUS';
import { SMOKE_PROBE_EVENT_TYPE } from '../constants/SMOKE_PROBE_EVENT_TYPE';
import { SmokeProbeEventPayload } from '../models/SmokeProbeEventQueueEvent';

// The full async fan-out / fan-in path: publish to the owned event bus, the
// subscribed queue's entry (onSmokeProbeEvent) writes a marker row, and this
// polls the store for it. Covers sns:Publish, the bus -> queue subscription,
// and the queue lambda's own store access, in one round trip.
export function* askRunEventBusTest(): AskResponse<void> {
  const markerId = yield* askNewGuid();

  const message: EventBusMessage<SmokeProbeEventPayload> = {
    type: SMOKE_PROBE_EVENT_TYPE,
    payload: { markerId },
  };

  yield* askEventBusSendMessages<SmokeProbeEventPayload>({
    eventBusName: SMOKE_PROBE_EVENT_BUS,
    eventBusMessages: [message],
  });

  yield* askSmokePollForMarker(markerId, 'the event bus and queue');
}
