import { QueueEvent, QueueMessage } from 'quidproquo';

export type SmokeRunRequestedPayload = {
  runId: string;
};

export type SmokeRunRequestedQueueEvent = QueueEvent<
  QueueMessage<SmokeRunRequestedPayload>
>;
