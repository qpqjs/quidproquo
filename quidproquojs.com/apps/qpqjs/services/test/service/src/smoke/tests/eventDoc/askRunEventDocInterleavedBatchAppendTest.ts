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
// each batch's events sit in one unbroken run in input order (a batch that lost its
// slots was re-laid whole above whoever beat it, never split around them), and the
// document folded through the registered definition holds exactly the numbers sent.
function* askRunInStore(runId: string): AskResponse<void> {
  const doc = yield* askEventDocCreate(
    `smoke-batch-${runId}`,
    `smoke-batch-${runId}`,
    SMOKE_EVENT_DOC_ACTOR
  );

  // Numbers are dealt out in send order: a batch writer takes the next BATCH_SIZE, a
  // single writer the next one. The two kinds alternate so neither gets a head start.
  let nextNumber = 1;
  const takeNumbers = (count: number): number[] =>
    Array.from({ length: count }, () => nextNumber++);

  const messages = Array.from(
    { length: BATCH_WRITERS + SINGLE_WRITERS },
    (_, index) => {
      const isBatch = index < BATCH_WRITERS * 2 && index % 2 === 0;
      return {
        type: SMOKE_EVENT_DOC_APPEND_MESSAGE_TYPE,
        payload: {
          docId: doc.id,
          runId,
          writerId: index + 1,
          values: takeNumbers(isBatch ? BATCH_SIZE : 1),
        } satisfies SmokeEventDocAppendPayload,
      };
    }
  );

  const expectedNumbers = messages.flatMap((message) => message.payload.values);

  yield* askQueueSendMessages(SMOKE_EVENT_DOC_APPEND_QUEUE, ...messages);

  const events = yield* askAwaitSmokeEventDocLog(
    doc.id,
    expectedNumbers.length + 1
  );

  yield* askAssertContiguousEventIds(events);

  const marked = events
    .filter((event) => event.type === SMOKE_EVENT_DOC_MARK_EVENT)
    .map((event) => ({
      eventId: event.payload.metadata.eventId,
      mark: event.payload.data as SmokeEventDocMark,
    }));

  for (const message of messages.filter((m) => m.payload.values.length > 1)) {
    const { writerId, values } = message.payload;
    const run = marked.filter((entry) => entry.mark.writerId === writerId);
    const consecutive = run.every(
      (entry, index) =>
        entry.mark.value === values[index] &&
        (index === 0 || entry.eventId === run[index - 1].eventId + 1)
    );

    yield* askSmokeAssert(
      run.length === values.length && consecutive,
      `batch writer ${writerId} did not land as one consecutive run in order: ids [${run.map((entry) => entry.eventId).join(', ')}]`
    );
  }

  yield* askAssertSmokeProbeDocState(doc.id, expectedNumbers);

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
