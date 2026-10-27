import { DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3';

import { createAwsClient } from '../createAwsClient';

// DeleteObjects rejects requests with more than 1000 keys, so larger deletes are split.
const MAX_KEYS_PER_DELETE_REQUEST = 1000;

/** Batch-deletes the given keys; returns the keys that FAILED to delete (empty array = all deleted). */
export const deleteFiles = async (drive: string, filepaths: string[], region: string): Promise<string[]> => {
  const s3Client = createAwsClient(S3Client, { region });

  const failedKeys: string[] = [];

  for (let offset = 0; offset < filepaths.length; offset += MAX_KEYS_PER_DELETE_REQUEST) {
    const batch = filepaths.slice(offset, offset + MAX_KEYS_PER_DELETE_REQUEST);

    const response = await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: drive,
        Delete: {
          Quiet: true,
          Objects: batch.map((filepath) => ({ Key: filepath })),
        },
      }),
    );

    failedKeys.push(...(response.Errors || []).map((deleteError) => deleteError.Key || ''));
  }

  return failedKeys;
};
