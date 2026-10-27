import { describe, expect, it, vi } from 'vitest';

import { publishMessage } from './publishMessage';

const send = vi.fn().mockResolvedValue({});

vi.mock('../createAwsClient', () => ({
  createAwsClient: () => ({ send }),
}));

describe('publishMessage', () => {
  it('publishes plain entries without FIFO fields', async () => {
    send.mockClear();

    await publishMessage('arn:topic', 'eu-west-1', [{ message: 'one' }, { message: 'two' }]);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].input).toEqual({
      TopicArn: 'arn:topic',
      PublishBatchRequestEntries: [
        { Message: 'one', Id: '0' },
        { Message: 'two', Id: '1' },
      ],
    });
  });

  it('sets MessageGroupId and MessageDeduplicationId when provided', async () => {
    send.mockClear();

    await publishMessage('arn:topic.fifo', 'eu-west-1', [{ message: 'one', groupId: 'group-1', deduplicationId: 'dedup-1' }]);

    expect(send.mock.calls[0][0].input).toEqual({
      TopicArn: 'arn:topic.fifo',
      PublishBatchRequestEntries: [{ Message: 'one', Id: '0', MessageGroupId: 'group-1', MessageDeduplicationId: 'dedup-1' }],
    });
  });

  it('publishes sequential batches of 10', async () => {
    send.mockClear();

    await publishMessage(
      'arn:topic',
      'eu-west-1',
      Array.from({ length: 12 }, (_, index) => ({ message: `${index}` })),
    );

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0].input.PublishBatchRequestEntries).toHaveLength(10);
    expect(send.mock.calls[1][0].input.PublishBatchRequestEntries).toHaveLength(2);
  });
});
