import { QPQBinaryData } from 'quidproquo-core';

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { createAwsClient } from '../createAwsClient';

export const readBinaryFile = async (bucketName: string, key: string, region: string): Promise<QPQBinaryData> => {
  const s3Client = createAwsClient(S3Client, { region });

  const response = await s3Client.send(
    new GetObjectCommand({
      Key: key,
      Bucket: bucketName,
    }),
  );

  const base64Data = await response.Body?.transformToString('base64');

  if (!base64Data) {
    throw new Error('Unable to transform body to base64');
  }

  return {
    base64Data: base64Data,
    mimetype: response.ContentType,
    filename: key.split('/').pop()!,
    contentDisposition: response.ContentDisposition,
  };
};
