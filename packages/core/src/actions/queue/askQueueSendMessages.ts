import { CrossModuleMessage } from '../../types';
import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { QueueActionType } from './QueueActionType';

export type QueueMessage<T> = CrossModuleMessage<T> & {
  /** FIFO queues only: message group for ordering. Defaults to the queue name (global ordering). */
  groupId?: string;

  /** FIFO queues only: dedup id (5-min SQS window). Defaults to a generated uuid (no dedup). */
  deduplicationId?: string;
};

export const askQueueSendMessagesBase = createActionRequester<void>()({
  actionType: QueueActionType.SendMessages,
  errorTypes: [
    'AccessDenied', // caller lacks permission to send to the queue
    'QueueNotFound', // the SQS queue does not exist
    'ServiceUnavailable', // SQS internal error / throttling
  ],
  getPayload: (queueName: string, queueMessages: QueueMessage<any>[]) => ({ queueMessages, queueName }),
});

// Generic so callers can pin the message body shape at the call site.
export function* askQueueSendMessages<T extends QueueMessage<any>>(queueName: string, ...queueMessages: T[]): AskResponse<void> {
  return yield* askQueueSendMessagesBase(queueName, queueMessages);
}
