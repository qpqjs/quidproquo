import {
  askDelay,
  askEventBusSendMessages,
  askKeyValueStoreDelete,
  askKeyValueStoreGet,
  askNewGuid,
  AskResponse,
  EventBusMessage,
  Nullable,
} from 'quidproquo';

import { SMOKE_PROBE_STORE } from '@qpqjs/constants';
import { SmokeProbeRecord } from '@qpqjs/test-models';

import {
  SMOKE_PROBE_EVENT_BUS,
  SMOKE_PROBE_EVENT_TYPE,
} from '../../constants/smokeProbe';
import { SmokeProbeEventPayload } from '../../models/SmokeProbeEventQueueEvent';
import { askSmokeAssert } from '../askSmokeAssert';

const POLL_ATTEMPTS = 15;
const POLL_INTERVAL_MS = 2000;

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

  let marker: Nullable<SmokeProbeRecord> = null;
  for (let attempt = 0; attempt < POLL_ATTEMPTS && !marker; attempt += 1) {
    yield* askDelay(POLL_INTERVAL_MS);
    marker = yield* askKeyValueStoreGet<SmokeProbeRecord>(
      SMOKE_PROBE_STORE,
      markerId
    );
  }

  yield* askSmokeAssert(
    !!marker,
    `marker [${markerId}] never arrived via the event bus and queue`
  );

  yield* askKeyValueStoreDelete(SMOKE_PROBE_STORE, markerId);
}
