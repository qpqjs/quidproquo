import { describe, expect, it, vi } from 'vitest';

import { transactPutItems } from './transactPutItems';

const send = vi.fn();

vi.mock('../createAwsClient', () => ({
  createAwsClient: () => ({ send }),
}));

const items = (count: number) => Array.from({ length: count }, (_, i) => ({ pk: 'doc', sk: i }));

describe('transactPutItems', () => {
  it('sends every item as a conditional Put in one transaction', async () => {
    send.mockClear().mockResolvedValue({});

    await transactPutItems('my-table', items(2), 'pk', 'eu-west-1');

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].input).toEqual({
      TransactItems: [
        {
          Put: {
            TableName: 'my-table',
            Item: { pk: { S: 'doc' }, sk: { N: '0' } },
            ConditionExpression: 'attribute_not_exists(#ineAttr)',
            ExpressionAttributeNames: { '#ineAttr': 'pk' },
          },
        },
        {
          Put: {
            TableName: 'my-table',
            Item: { pk: { S: 'doc' }, sk: { N: '1' } },
            ConditionExpression: 'attribute_not_exists(#ineAttr)',
            ExpressionAttributeNames: { '#ineAttr': 'pk' },
          },
        },
      ],
    });
  });

  it('chunks at 100 items per transaction', async () => {
    send.mockClear().mockResolvedValue({});

    await transactPutItems('my-table', items(250), 'pk', 'eu-west-1');

    expect(send.mock.calls.map(([command]: [{ input: { TransactItems: unknown[] } }]) => command.input.TransactItems.length)).toEqual([100, 100, 50]);
  });

  it('rethrows a ConditionalCheckFailed cancellation as ConditionalCheckFailedException', async () => {
    const cancelled = Object.assign(new Error('cancelled'), {
      name: 'TransactionCanceledException',
      CancellationReasons: [{ Code: 'None' }, { Code: 'ConditionalCheckFailed' }],
    });
    send.mockClear().mockRejectedValue(cancelled);

    const error = await transactPutItems('my-table', items(2), 'pk', 'eu-west-1').catch((e) => e);

    expect(error.name).toBe('ConditionalCheckFailedException');
  });

  it('rethrows any other cancellation untouched', async () => {
    const cancelled = Object.assign(new Error('throttled'), {
      name: 'TransactionCanceledException',
      CancellationReasons: [{ Code: 'ThrottlingError' }],
    });
    send.mockClear().mockRejectedValue(cancelled);

    const error = await transactPutItems('my-table', items(1), 'pk', 'eu-west-1').catch((e) => e);

    expect(error).toBe(cancelled);
  });
});
