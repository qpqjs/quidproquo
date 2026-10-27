import { beforeEach, describe, expect, it, vi } from 'vitest';

import { copyFile } from './copyFile';

const send = vi.fn();

vi.mock('../createAwsClient', () => ({
  createAwsClient: () => ({ send }),
}));

describe('copyFile', () => {
  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({});
  });

  it('issues one CopyObject from the encoded source to the target key', async () => {
    await copyFile('src-bucket', 'doc 1/assets/a+b', 'dst-bucket', 'doc-2/assets/c', 'eu-west-1');

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].input).toEqual({
      CopySource: 'src-bucket/doc%201/assets/a%2Bb',
      Bucket: 'dst-bucket',
      Key: 'doc-2/assets/c',
    });
  });

  it('propagates the S3 error', async () => {
    send.mockRejectedValueOnce(Object.assign(new Error('missing'), { name: 'NoSuchKey' }));

    await expect(copyFile('a', 'x', 'b', 'y', 'eu-west-1')).rejects.toMatchObject({ name: 'NoSuchKey' });
  });
});
