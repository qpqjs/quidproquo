import { GetQueueUrlCommand, SQSClient } from '@aws-sdk/client-sqs';

export const getQueueUrl = async (queueName: string, sqsClient: SQSClient): Promise<string> => {
  const response = await sqsClient.send(
    new GetQueueUrlCommand({
      QueueName: queueName,
    }),
  );

  return response.QueueUrl || '';
};
