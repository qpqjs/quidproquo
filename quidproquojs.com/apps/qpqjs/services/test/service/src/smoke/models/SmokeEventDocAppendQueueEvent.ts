import { QueueEvent, QueueMessage } from 'quidproquo';

// One writer's instruction: append `count` marks to `docId` for `runId`. A count of 1
// goes through the single server append, anything more through the batch append, so
// the two tests exercise both paths against the same log.
export type SmokeEventDocAppendPayload = {
  docId: string;
  runId: string;
  writerId: number;
  count: number;
};

export type SmokeEventDocAppendQueueEvent = QueueEvent<
  QueueMessage<SmokeEventDocAppendPayload>
>;
