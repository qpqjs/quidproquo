import { QueueMessage } from '../actions';

export interface QueueEventTypeParams {
  [key: string]: string;
}

export interface QueueEvent<T extends QueueMessage<any>> {
  message: T;
  id: string;

  /** FIFO queues only: the MessageGroupId of the source record. */
  groupId?: string;
}

export type QueueEventResponse = boolean;
