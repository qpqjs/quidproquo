import { describe, expect, it, vi } from 'vitest';

import { deleteItem } from './deleteItem';

const send = vi.fn().mockResolvedValue({});

vi.mock('../createAwsClient', () => ({
  createAwsClient: () => ({ send }),
}));

describe('deleteItem', () => {
  it('deletes by partition key alone', async () => {
    send.mockClear();

    await deleteItem('my-table', 'eu-west-1', 'user-1', 'id');

    expect(send.mock.calls[0][0].input).toEqual({
      TableName: 'my-table',
      Key: { id: { S: 'user-1' } },
    });
  });

  it('includes the sort key in the delete key', async () => {
    send.mockClear();

    await deleteItem('my-table', 'eu-west-1', 'user-1', 'id', 'v2', 'version');

    expect(send.mock.calls[0][0].input.Key).toEqual({
      id: { S: 'user-1' },
      version: { S: 'v2' },
    });
  });

  it('includes a falsy (zero) sort key in the delete key', async () => {
    send.mockClear();

    await deleteItem('my-table', 'eu-west-1', 'user-1', 'id', 0, 'version');

    expect(send.mock.calls[0][0].input.Key).toEqual({
      id: { S: 'user-1' },
      version: { N: '0' },
    });
  });
});
