import { QueueEvent, QueueMessage } from 'quidproquo';

export type SmokeProbeEventPayload = {
  markerId: string;
};

export type SmokeProbeEventQueueEvent = QueueEvent<
  QueueMessage<SmokeProbeEventPayload>
>;
