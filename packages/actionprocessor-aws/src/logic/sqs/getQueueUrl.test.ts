import { describe, expect, it, vi } from 'vitest';
import { SQSClient } from '@aws-sdk/client-sqs';

import { getQueueUrl } from './getQueueUrl';

describe('getQueueUrl', () => {
  it('sends a GetQueueUrlCommand for the queue name and returns the url', async () => {
    const send = vi.fn().mockResolvedValue({ QueueUrl: 'https://sqs/queue' });

    const url = await getQueueUrl('my-queue', { send } as unknown as SQSClient);

    expect(url).toBe('https://sqs/queue');
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].input).toEqual({ QueueName: 'my-queue' });
  });

  it('falls back to an empty string when no url is returned', async () => {
    const send = vi.fn().mockResolvedValue({});

    expect(await getQueueUrl('my-queue', { send } as unknown as SQSClient)).toBe('');
  });
});
