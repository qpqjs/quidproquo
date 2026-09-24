import { QueueEvent, QueueMessage } from 'quidproquo';

// One writer's instruction: append one mark per value to `docId` for `runId`. A single
// value goes through the single server append, several through the batch append, so
// the tests exercise both paths against the same log.
export type SmokeEventDocAppendPayload = {
  docId: string;
  runId: string;
  writerId: number;
  values: number[];
};

export type SmokeEventDocAppendQueueEvent = QueueEvent<
  QueueMessage<SmokeEventDocAppendPayload>
>;
