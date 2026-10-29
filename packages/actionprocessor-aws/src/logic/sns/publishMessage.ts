import { PublishBatchCommand, PublishBatchRequestEntry, SNSClient } from '@aws-sdk/client-sns';

import { createAwsClient } from '../createAwsClient';

// PublishBatch accepts at most 10 entries per request (and 256 KB total payload)
const MAX_ENTRIES_PER_BATCH = 10;

export type SnsPublishMessageEntry = {
  message: string;

  // FIFO topics only
  groupId?: string;
  deduplicationId?: string;
};

/**
 * Publishes the messages to the topic in sequential batches of 10. Batches are awaited
 * one at a time so FIFO topics keep their ordering; callers that don't need ordering can
 * split the messages and publish in parallel themselves.
 */
export const publishMessage = async (topicArn: string, region: string, messages: SnsPublishMessageEntry[]): Promise<void> => {
  const snsClient = createAwsClient(SNSClient, { region });

  const entries: PublishBatchRequestEntry[] = messages.map((message, index) => ({
    Message: message.message,
    Id: `${index}`,

    ...(message.groupId !== undefined ? { MessageGroupId: message.groupId } : {}),
    ...(message.deduplicationId !== undefined ? { MessageDeduplicationId: message.deduplicationId } : {}),
  }));

  for (let offset = 0; offset < entries.length; offset += MAX_ENTRIES_PER_BATCH) {
    await snsClient.send(
      new PublishBatchCommand({
        TopicArn: topicArn,
        PublishBatchRequestEntries: entries.slice(offset, offset + MAX_ENTRIES_PER_BATCH),
      }),
    );
  }
};
