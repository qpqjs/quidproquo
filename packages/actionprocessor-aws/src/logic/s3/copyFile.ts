import { CopyObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { createAwsClient } from '../createAwsClient';

// CopySource is a URL path, so each key segment is percent-encoded (a key can hold spaces, '+', '#'...);
// the '/' between segments stays a separator.
const encodeCopySource = (bucketName: string, key: string): string => `${bucketName}/${key.split('/').map(encodeURIComponent).join('/')}`;

/**
 * Server-side copies one object to another key (same or another bucket). The default COPY metadata
 * directive carries the stored Content-Type / Content-Disposition across unchanged.
 */
export const copyFile = async (
  sourceBucketName: string,
  sourceKey: string,
  targetBucketName: string,
  targetKey: string,
  region: string,
): Promise<void> => {
  const s3Client = createAwsClient(S3Client, { region });

  await s3Client.send(
    new CopyObjectCommand({
      CopySource: encodeCopySource(sourceBucketName, sourceKey),
      Bucket: targetBucketName,
      Key: targetKey,
    }),
  );
};
