import { createActionRequester } from '../../logic/actions/createActionRequester';
import { CrossModuleMessage } from '../../types';
import { AskResponse } from '../../types/StorySession';
import { QueueActionType } from './QueueActionType';

export type QueueMessage<T> = CrossModuleMessage<T> & {
  /** FIFO queues only: message group for ordering. Defaults to the queue name (global ordering). */
  groupId?: string;

  /** FIFO queues only: dedup id (5-min SQS window). Defaults to a generated uuid (no dedup). */
  deduplicationId?: string;
};

export const askQueueSendMessagesBase = createActionRequester<void>()({
  actionType: QueueActionType.SendMessage,
  errorTypes: [
    'AccessDenied', // caller lacks permission to send to the queue
    'QueueNotFound', // the queue does not exist
    'Throttled', // the queue is throttling or failed internally; transient
  ],
  getPayload: (queueName: string, queueMessages: QueueMessage<any>[]) => ({ queueMessages, queueName }),
});

// Generic so callers can pin the message body shape at the call site.
function* askQueueSendMessagesTyped<T extends QueueMessage<any>>(queueName: string, ...queueMessages: T[]): AskResponse<void> {
  return yield* askQueueSendMessagesBase(queueName, queueMessages);
}

/** Carries the base requester's `errorType` catalog so callers can match on it. */
export const askQueueSendMessages = Object.assign(askQueueSendMessagesTyped, { errorType: askQueueSendMessagesBase.errorType });
