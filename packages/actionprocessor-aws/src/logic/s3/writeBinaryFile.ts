import { QPQBinaryData } from 'quidproquo-core';

import { PutObjectCommand, S3Client, StorageClass } from '@aws-sdk/client-s3';

import { createAwsClient } from '../createAwsClient';

export const writeBinaryFile = async (
  bucketName: string,
  key: string,
  data: QPQBinaryData,
  region: string,
  storageClass: keyof typeof StorageClass,
): Promise<void> => {
  const s3Client = createAwsClient(S3Client, { region });

  await s3Client.send(
    new PutObjectCommand({
      Key: key,
      Bucket: bucketName,
      Body: Buffer.from(data.base64Data, 'base64'),
      ContentType: data.mimetype,
      ContentDisposition: data.contentDisposition,

      StorageClass: storageClass,
    }),
  );
};
