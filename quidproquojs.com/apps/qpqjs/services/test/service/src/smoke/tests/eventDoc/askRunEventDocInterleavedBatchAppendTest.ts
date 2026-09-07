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
import { SmokeEventDocAppendPayload } from '../../models/SmokeEventDocAppendQueueEvent';
import { SmokeEventDocMark } from '../../models/SmokeEventDocMark';
import { askSmokeAssert } from '../askSmokeAssert';
import { askAssertContiguousEventIds } from './askAssertContiguousEventIds';
import { askAssertSmokeProbeDocState } from './askAssertSmokeProbeDocState';
import { askAwaitSmokeEventDocLog } from './askAwaitSmokeEventDocLog';

const BATCH_WRITERS = 4;
const BATCH_SIZE = 5;
const SINGLE_WRITERS = 6;

// Batch writers (one transactional write of BATCH_SIZE consecutive slots each) racing
// single writers on the same fresh document. Every writer lands, the log is contiguous,
// and each batch's events sit in one unbroken run in input order: a batch that lost its
// slots was re-laid whole above whoever beat it, never split around them.
function* askRunInStore(runId: string): AskResponse<void> {
  const doc = yield* askEventDocCreate(
    `smoke-batch-${runId}`,
    `smoke-batch-${runId}`,
    SMOKE_EVENT_DOC_ACTOR
  );

  const writer = (writerId: number, count: number) => ({
    type: SMOKE_EVENT_DOC_APPEND_MESSAGE_TYPE,
    payload: {
      docId: doc.id,
      runId,
      writerId,
      count,
    } satisfies SmokeEventDocAppendPayload,
  });

  // Interleave the two kinds in the send order so neither gets a head start.
  const messages = Array.from(
    { length: BATCH_WRITERS + SINGLE_WRITERS },
    (_, index) =>
      index < BATCH_WRITERS * 2 && index % 2 === 0
        ? writer(index + 1, BATCH_SIZE)
        : writer(index + 1, 1)
  );

  yield* askQueueSendMessages(SMOKE_EVENT_DOC_APPEND_QUEUE, ...messages);

  const expectedMarks = BATCH_WRITERS * BATCH_SIZE + SINGLE_WRITERS;
  const events = yield* askAwaitSmokeEventDocLog(doc.id, expectedMarks + 1);

  yield* askAssertContiguousEventIds(events);

  const marked = events
    .filter((event) => event.type === SMOKE_EVENT_DOC_MARK_EVENT)
    .map((event) => ({
      eventId: event.payload.metadata.eventId,
      mark: event.payload.data as SmokeEventDocMark,
    }));

  yield* askSmokeAssert(
    marked.length === expectedMarks,
    `expected ${expectedMarks} marks, found ${marked.length}`
  );

  const batchWriterIds = new Set(
    messages
      .filter((message) => message.payload.count > 1)
      .map((message) => message.payload.writerId)
  );

  for (const writerId of batchWriterIds) {
    const run = marked.filter((entry) => entry.mark.writerId === writerId);
    const consecutive = run.every(
      (entry, index) =>
        entry.mark.seq === index &&
        (index === 0 || entry.eventId === run[index - 1].eventId + 1)
    );

    yield* askSmokeAssert(
      run.length === BATCH_SIZE && consecutive,
      `batch writer ${writerId} did not land as one consecutive run: ids [${run.map((entry) => entry.eventId).join(', ')}]`
    );
  }

  yield* askAssertSmokeProbeDocState(doc.id, expectedMarks);

  yield* askEventDocSoftDelete(
    doc.id,
    SMOKE_EVENT_DOC_ACTOR.userId,
    SMOKE_EVENT_DOC_SCHEMA_VERSION
  );
}

export function* askRunEventDocInterleavedBatchAppendTest(
  runId: string
): AskResponse<void> {
  yield* askEventDocProvideStore(
    SMOKE_EVENT_DOC_STORE_OPTIONS,
    askRunInStore(runId)
  );
}
