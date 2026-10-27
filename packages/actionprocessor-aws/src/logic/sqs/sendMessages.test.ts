import { describe, expect, it, vi } from 'vitest';

import { sendMessages } from './sendMessages';

const send = vi.fn().mockResolvedValue({});

vi.mock('../createAwsClient', () => ({
  createAwsClient: () => ({ send }),
}));

vi.mock('./getQueueUrl', () => ({
  getQueueUrl: vi.fn().mockResolvedValue('https://sqs/queue'),
}));

describe('sendMessages', () => {
  it('sends plain entries without FIFO fields', async () => {
    send.mockClear();

    await sendMessages('my-queue', 'eu-west-1', [{ body: 'one' }, { body: 'two' }]);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].input).toEqual({
      QueueUrl: 'https://sqs/queue',
      Entries: [
        { MessageBody: 'one', Id: '0' },
        { MessageBody: 'two', Id: '1' },
      ],
    });
  });

  it('sets MessageGroupId and MessageDeduplicationId when provided', async () => {
    send.mockClear();

    await sendMessages('my-queue.fifo', 'eu-west-1', [{ body: 'one', groupId: 'group-1', deduplicationId: 'dedup-1' }]);

    expect(send.mock.calls[0][0].input).toEqual({
      QueueUrl: 'https://sqs/queue',
      Entries: [{ MessageBody: 'one', Id: '0', MessageGroupId: 'group-1', MessageDeduplicationId: 'dedup-1' }],
    });
  });

  it('sends sequential batches of 10', async () => {
    send.mockClear();

    await sendMessages(
      'my-queue',
      'eu-west-1',
      Array.from({ length: 12 }, (_, index) => ({ body: `${index}` })),
    );

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0].input.Entries).toHaveLength(10);
    expect(send.mock.calls[1][0].input.Entries).toHaveLength(2);
  });
});
