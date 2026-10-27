import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteFiles } from './deleteFiles';

const send = vi.fn();

vi.mock('../createAwsClient', () => ({
  createAwsClient: () => ({ send }),
}));

describe('deleteFiles', () => {
  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({});
  });

  it('deletes the given keys quietly and returns no failures on success', async () => {
    const failed = await deleteFiles('my-bucket', ['a.txt', 'b.txt'], 'eu-west-1');

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].input).toEqual({
      Bucket: 'my-bucket',
      Delete: {
        Quiet: true,
        Objects: [{ Key: 'a.txt' }, { Key: 'b.txt' }],
      },
    });
    expect(failed).toEqual([]);
  });

  it('returns the keys that failed to delete', async () => {
    send.mockResolvedValueOnce({ Errors: [{ Key: 'b.txt', Code: 'AccessDenied' }] });

    expect(await deleteFiles('my-bucket', ['a.txt', 'b.txt'], 'eu-west-1')).toEqual(['b.txt']);
  });

  it('splits requests into batches of 1000 (the DeleteObjects per-request limit)', async () => {
    const filepaths = Array.from({ length: 1500 }, (_, index) => `file-${index}.txt`);

    await deleteFiles('my-bucket', filepaths, 'eu-west-1');

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0].input.Delete.Objects).toHaveLength(1000);
    expect(send.mock.calls[1][0].input.Delete.Objects).toHaveLength(500);
  });
});
