import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listFiles } from './listFiles';

const send = vi.fn();

vi.mock('../createAwsClient', () => ({
  createAwsClient: () => ({ send }),
}));

describe('listFiles', () => {
  beforeEach(() => {
    send.mockReset();
  });

  it('lists directories (CommonPrefixes) and files, appending a trailing delimiter to the folder', async () => {
    send.mockResolvedValueOnce({
      CommonPrefixes: [{ Prefix: 'docs/images/' }],
      Contents: [{ Key: 'docs/readme.md', ETag: 'etag-1' }],
      NextContinuationToken: 'next-token',
    });

    const result = await listFiles('my-bucket', 'eu-west-1', 'docs');

    expect(send.mock.calls[0][0].input).toEqual({
      Bucket: 'my-bucket',
      Delimiter: '/',
      Prefix: 'docs/',
      ContinuationToken: undefined,
      MaxKeys: 1000,
    });
    expect(result).toEqual({
      fileInfos: [
        { filepath: 'docs/images/', isDir: true },
        { filepath: 'docs/readme.md', isDir: false, hashMd5: 'etag-1' },
      ],
      pageToken: 'next-token',
    });
  });

  it('keeps directories that appear on continuation pages', async () => {
    send.mockResolvedValueOnce({
      CommonPrefixes: [{ Prefix: 'docs/page-two-dir/' }],
      Contents: [{ Key: 'docs/page-two.md', ETag: 'etag-2' }],
    });

    const result = await listFiles('my-bucket', 'eu-west-1', 'docs/', 1000, 'page-2-token');

    expect(send.mock.calls[0][0].input.ContinuationToken).toBe('page-2-token');
    expect(result.fileInfos).toContainEqual({ filepath: 'docs/page-two-dir/', isDir: true });
  });

  it('excludes the listed folder marker object even when the folder arg has no trailing delimiter', async () => {
    send.mockResolvedValueOnce({
      Contents: [
        { Key: 'docs/', ETag: 'marker' },
        { Key: 'docs/readme.md', ETag: 'etag-1' },
      ],
    });

    const result = await listFiles('my-bucket', 'eu-west-1', 'docs');

    expect(result.fileInfos).toEqual([{ filepath: 'docs/readme.md', isDir: false, hashMd5: 'etag-1' }]);
  });

  it('lists the bucket root when no folder is given', async () => {
    send.mockResolvedValueOnce({
      CommonPrefixes: [{ Prefix: 'top/' }],
      Contents: [{ Key: 'root.txt' }],
    });

    const result = await listFiles('my-bucket', 'eu-west-1');

    expect(send.mock.calls[0][0].input.Prefix).toBe('');
    expect(result.fileInfos).toEqual([
      { filepath: 'top/', isDir: true },
      { filepath: 'root.txt', isDir: false, hashMd5: undefined },
    ]);
  });
});
