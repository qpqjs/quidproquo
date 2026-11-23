import { QueueEvent, QueueMessage } from 'quidproquo';

/** What a busy queue message carries: the marker its consumer writes once it has held the message. */
export type SmokeBusyQueuePayload = {
  markerId: string;
};

/** A busy queue message as its consumer receives it. */
export type SmokeBusyQueueEvent = QueueEvent<QueueMessage<SmokeBusyQueuePayload>>;
