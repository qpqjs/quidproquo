import { askQueueSendMessages, AskResponse } from 'quidproquo';
import {
  askEventDocCreate,
  askEventDocProvideStore,
  askEventDocSoftDelete,
} from 'quidproquo-features';

import {
  SMOKE_EVENT_DOC_ACTOR,
  SMOKE_EVENT_DOC_APPEND_MESSAGE_TYPE,
  SMOKE_EVENT_DOC_APPEND_QUEUE,
  SMOKE_EVENT_DOC_MARK_EVENT,
  SMOKE_EVENT_DOC_SCHEMA_VERSION,
  SMOKE_EVENT_DOC_STORE_OPTIONS,
} from '../../constants/smokeEventDoc';
import { SMOKE_PROBE_DOC_WINDOW } from '../../eventDoc/smokeProbeDocDefinition';
import { SmokeEventDocAppendPayload } from '../../models/SmokeEventDocAppendQueueEvent';
import { SmokeEventDocMark } from '../../models/SmokeEventDocMark';
import { askSmokeAssert } from '../askSmokeAssert';
import { askAssertContiguousEventIds } from './askAssertContiguousEventIds';
import { askAssertSmokeProbeDocState } from './askAssertSmokeProbeDocState';
import { askAwaitSmokeEventDocLog } from './askAwaitSmokeEventDocLog';

// One writer per number the document can hold, so the folded window is exactly full.
const WRITERS = SMOKE_PROBE_DOC_WINDOW;

// N writers, each its own queue invocation, each appending ONE number (1..N) to the
// same fresh document at the same moment. The conditional-write append loop has to
// serialise them onto consecutive slots: afterwards the log is INIT_STATE plus one mark
// per writer, ids 0..N with no hole and no duplicate, and the document folded through
// the registered definition holds exactly the numbers 1..N.
function* askRunInStore(runId: string): AskResponse<void> {
  const doc = yield* askEventDocCreate(
    `smoke-${runId}`,
    `smoke-${runId}`,
    SMOKE_EVENT_DOC_ACTOR
  );

  const numbers = Array.from({ length: WRITERS }, (_, index) => index + 1);

  const messages = numbers.map((value) => ({
    type: SMOKE_EVENT_DOC_APPEND_MESSAGE_TYPE,
    payload: {
      docId: doc.id,
      runId,
      writerId: value,
      values: [value],
    } satisfies SmokeEventDocAppendPayload,
  }));

  yield* askQueueSendMessages(SMOKE_EVENT_DOC_APPEND_QUEUE, ...messages);

  const events = yield* askAwaitSmokeEventDocLog(doc.id, WRITERS + 1);

  yield* askAssertContiguousEventIds(events);

  const marks = events
    .filter((event) => event.type === SMOKE_EVENT_DOC_MARK_EVENT)
    .map((event) => event.payload.data as SmokeEventDocMark);

  yield* askSmokeAssert(
    marks.every((mark) => mark.runId === runId),
    "a mark from another run is on this run's document"
  );

  yield* askAssertSmokeProbeDocState(doc.id, numbers);

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
