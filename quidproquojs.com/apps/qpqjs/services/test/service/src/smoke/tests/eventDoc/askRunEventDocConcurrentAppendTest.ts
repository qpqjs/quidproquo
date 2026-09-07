import { askQueueSendMessages, AskResponse } from 'quidproquo';
import {
  askEventDocCreate,
  askEventDocProvideStore,
  askEventDocSoftDelete,
  EventDocEvent,
} from 'quidproquo-features';

import {
  SMOKE_EVENT_DOC_ACTOR,
  SMOKE_EVENT_DOC_APPEND_MESSAGE_TYPE,
  SMOKE_EVENT_DOC_APPEND_QUEUE,
  SMOKE_EVENT_DOC_MARK_EVENT,
  SMOKE_EVENT_DOC_SCHEMA_VERSION,
  SMOKE_EVENT_DOC_STORE_OPTIONS,
} from '../../constants/smokeEventDoc';
import { SmokeEventDocAppendPayload } from '../../models/SmokeEventDocAppendQueueEvent';
import { SmokeEventDocMark } from '../../models/SmokeEventDocMark';
import { askSmokeAssert } from '../askSmokeAssert';
import { askAssertContiguousEventIds } from './askAssertContiguousEventIds';
import { askAssertSmokeProbeDocState } from './askAssertSmokeProbeDocState';
import { askAwaitSmokeEventDocLog } from './askAwaitSmokeEventDocLog';

const WRITERS = 12;

// N writers, each its own queue invocation, each appending ONE event to the same fresh
// document at the same moment. The conditional-write append loop has to serialise them
// onto consecutive slots: afterwards the log is INIT_STATE plus exactly one mark per
// writer, ids 0..N with no hole, no duplicate and no lost writer.
function* askRunInStore(runId: string): AskResponse<void> {
  const doc = yield* askEventDocCreate(
    `smoke-${runId}`,
    `smoke-${runId}`,
    SMOKE_EVENT_DOC_ACTOR
  );

  const messages = Array.from({ length: WRITERS }, (_, index) => ({
    type: SMOKE_EVENT_DOC_APPEND_MESSAGE_TYPE,
    payload: {
      docId: doc.id,
      runId,
      writerId: index + 1,
      count: 1,
    } satisfies SmokeEventDocAppendPayload,
  }));

  yield* askQueueSendMessages(SMOKE_EVENT_DOC_APPEND_QUEUE, ...messages);

  const events = yield* askAwaitSmokeEventDocLog(doc.id, WRITERS + 1);

  yield* askAssertContiguousEventIds(events);

  const marks = events
    .filter((event) => event.type === SMOKE_EVENT_DOC_MARK_EVENT)
    .map((event: EventDocEvent) => event.payload.data as SmokeEventDocMark);

  yield* askSmokeAssert(
    marks.every((mark) => mark.runId === runId),
    "a mark from another run is on this run's document"
  );

  const writerIds = new Set(marks.map((mark) => mark.writerId));
  yield* askSmokeAssert(
    writerIds.size === WRITERS && marks.length === WRITERS,
    `expected one mark from each of ${WRITERS} writers, got ${marks.length} marks from ${writerIds.size} writers`
  );

  yield* askAssertSmokeProbeDocState(doc.id, WRITERS);

  yield* askEventDocSoftDelete(
    doc.id,
    SMOKE_EVENT_DOC_ACTOR.userId,
    SMOKE_EVENT_DOC_SCHEMA_VERSION
  );
}

export function* askRunEventDocConcurrentAppendTest(
  runId: string
): AskResponse<void> {
  yield* askEventDocProvideStore(
    SMOKE_EVENT_DOC_STORE_OPTIONS,
    askRunInStore(runId)
  );
}
