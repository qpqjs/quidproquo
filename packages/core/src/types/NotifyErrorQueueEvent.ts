import { QueueMessage } from '../actions';
import { QueueEvent } from './QueueEvent';

export enum NotifyErrorQueueEvents {
  Error = 'Error',
  Timeout = 'Timeout',
  Throttle = 'Throttle',
  Unknown = 'Unknown',
}

export type NotifyErrorQueueBaseEventPayload = {
  newStateInAlarm: boolean;
  newStateReason: string;

  oldStateInAlarm: boolean;
};

// Error

export type NotifyErrorQueueErrorEventPayload = NotifyErrorQueueBaseEventPayload;

export type NotifyErrorQueueErrorEventMessage = {
  type: NotifyErrorQueueEvents.Error;
} & QueueMessage<NotifyErrorQueueErrorEventPayload>;

export type NotifyErrorQueueErrorQueueEvent = QueueEvent<NotifyErrorQueueErrorEventMessage>;

// Timeout

export type NotifyErrorQueueTimeoutEventPayload = NotifyErrorQueueBaseEventPayload;

export type NotifyErrorQueueTimeoutEventMessage = {
  type: NotifyErrorQueueEvents.Timeout;
} & QueueMessage<NotifyErrorQueueTimeoutEventPayload>;

export type NotifyErrorQueueTimeoutQueueEvent = QueueEvent<NotifyErrorQueueTimeoutEventMessage>;

// Throttle

export type NotifyErrorQueueThrottleEventPayload = NotifyErrorQueueBaseEventPayload;

export type NotifyErrorQueueThrottleEventMessage = {
  type: NotifyErrorQueueEvents.Throttle;
} & QueueMessage<NotifyErrorQueueThrottleEventPayload>;

export type NotifyErrorQueueThrottleQueueEvent = QueueEvent<NotifyErrorQueueThrottleEventMessage>;
