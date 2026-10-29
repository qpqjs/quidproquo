import { SendMessageBatchCommand, SendMessageBatchRequestEntry, SQSClient } from '@aws-sdk/client-sqs';

import { createAwsClient } from '../createAwsClient';
import { getQueueUrl } from './getQueueUrl';

// SendMessageBatch accepts at most 10 entries per request
const MAX_ENTRIES_PER_BATCH = 10;

export type SqsQueueMessageEntry = {
  body: string;

  // FIFO queues only
  groupId?: string;
  deduplicationId?: string;
};

/**
 * Sends the messages to the queue in sequential batches of 10. Batches are awaited one
 * at a time so FIFO queues keep their ordering; callers that don't need ordering can
 * split the messages and send in parallel themselves.
 */
export const sendMessages = async (queueName: string, region: string, messages: SqsQueueMessageEntry[]): Promise<void> => {
  const sqsClient = createAwsClient(SQSClient, { region });

  const url = await getQueueUrl(queueName, sqsClient);

  const entries: SendMessageBatchRequestEntry[] = messages.map((message, index) => ({
    MessageBody: message.body,
    Id: `${index}`,

    ...(message.groupId !== undefined ? { MessageGroupId: message.groupId } : {}),
    ...(message.deduplicationId !== undefined ? { MessageDeduplicationId: message.deduplicationId } : {}),
  }));

  for (let offset = 0; offset < entries.length; offset += MAX_ENTRIES_PER_BATCH) {
    await sqsClient.send(
      new SendMessageBatchCommand({
        Entries: entries.slice(offset, offset + MAX_ENTRIES_PER_BATCH),
        QueueUrl: url,
      }),
    );
  }
};
