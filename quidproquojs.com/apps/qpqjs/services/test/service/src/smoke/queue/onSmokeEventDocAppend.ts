import { AskResponse, QueueEventResponse } from 'quidproquo';
import {
  askEventDocAppendServerEvent,
  askEventDocAppendServerEvents,
  askEventDocProvideStore,
  EventDocServerEventInput,
} from 'quidproquo-features';

import {
  SMOKE_EVENT_DOC_ACTOR,
  SMOKE_EVENT_DOC_MARK_EVENT,
  SMOKE_EVENT_DOC_SCHEMA_VERSION,
  SMOKE_EVENT_DOC_STORE_OPTIONS,
} from '../constants/smokeEventDoc';
import { SmokeEventDocAppendQueueEvent } from '../models/SmokeEventDocAppendQueueEvent';
import { SmokeEventDocMark } from '../models/SmokeEventDocMark';

// One writer in the event-doc concurrency tests. Every message is its own invocation,
// so the writers of a test race each other for the log's next slots for real - the
// conditional-write loop in the append stories is what has to keep them contiguous.
function* askAppendMarks(
  docId: string,
  runId: string,
  writerId: number,
  count: number
): AskResponse<void> {
  const mark = (seq: number): SmokeEventDocMark => ({ runId, writerId, seq });

  if (count === 1) {
    yield* askEventDocAppendServerEvent(
      docId,
      SMOKE_EVENT_DOC_MARK_EVENT,
      mark(0),
      SMOKE_EVENT_DOC_SCHEMA_VERSION,
      SMOKE_EVENT_DOC_ACTOR
    );
    return;
  }

  const inputs: EventDocServerEventInput[] = Array.from(
    { length: count },
    (_, seq) => ({
      type: SMOKE_EVENT_DOC_MARK_EVENT,
      data: mark(seq),
      version: SMOKE_EVENT_DOC_SCHEMA_VERSION,
    })
  );

  yield* askEventDocAppendServerEvents(docId, inputs, SMOKE_EVENT_DOC_ACTOR);
}

export function* onSmokeEventDocAppend(
  event: SmokeEventDocAppendQueueEvent
): AskResponse<QueueEventResponse> {
  const { docId, runId, writerId, count } = event.message.payload;

  yield* askEventDocProvideStore(
    SMOKE_EVENT_DOC_STORE_OPTIONS,
    askAppendMarks(docId, runId, writerId, count)
  );

  return true;
}
