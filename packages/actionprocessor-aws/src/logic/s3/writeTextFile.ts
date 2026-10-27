import { PutObjectCommand, S3Client, StorageClass } from '@aws-sdk/client-s3';

import { createAwsClient } from '../createAwsClient';

export const writeTextFile = async (
  bucketName: string,
  key: string,
  data: string,
  region: string,
  storageClass: keyof typeof StorageClass,
): Promise<void> => {
  const s3Client = createAwsClient(S3Client, { region });

  await s3Client.send(
    new PutObjectCommand({
      Key: key,
      Bucket: bucketName,
      Body: Buffer.from(data),
      StorageClass: storageClass,
    }),
  );
};
