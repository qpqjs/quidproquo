import { kvsLessThan, kvsNotExists, kvsOr, KvsUpdateActionType } from '@qpqjs/core';

import { describe, expect, it, vi } from 'vitest';

import { updateItem } from './updateItem';

const send = vi.fn();

vi.mock('../createAwsClient', () => ({
  createAwsClient: () => ({ send }),
}));

const update = [{ attributePath: 'headEventId', action: KvsUpdateActionType.Set, value: 7 }];

describe('updateItem', () => {
  it('sends no ConditionExpression without a condition', async () => {
    send.mockClear().mockResolvedValue({ Attributes: { id: { S: 'doc-1' }, headEventId: { N: '7' } } });

    const item = await updateItem('my-table', 'eu-west-1', update, 'id', 'doc-1');

    expect(item).toEqual({ id: 'doc-1', headEventId: 7 });
    expect(send.mock.calls[0][0].input.ConditionExpression).toBeUndefined();
  });

  it('guards the write with the condition and merges its placeholders into the update maps', async () => {
    send.mockClear().mockResolvedValue({ Attributes: {} });

    await updateItem(
      'my-table',
      'eu-west-1',
      update,
      'id',
      'doc-1',
      undefined,
      undefined,
      kvsOr([kvsNotExists('headEventId'), kvsLessThan('headEventId', 7)]),
    );

    const { input } = send.mock.calls[0][0];
    const names = Object.entries(input.ExpressionAttributeNames) as [string, string][];
    const values = Object.entries(input.ExpressionAttributeValues) as [string, unknown][];

    // One name placeholder serves both the SET and the condition, and the value 7 is shared the same way.
    expect(names).toEqual([[expect.stringMatching(/^#/), 'headEventId']]);
    expect(values).toEqual([[expect.stringMatching(/^:/), { N: '7' }]]);
    expect(input.ConditionExpression).toBe(`(attribute_not_exists(${names[0][0]})) OR (${names[0][0]} < ${values[0][0]})`);
    expect(input.UpdateExpression).toBe(`SET ${names[0][0]} = ${values[0][0]}`);
  });
});
