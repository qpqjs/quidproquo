import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { createAwsClient } from '../createAwsClient';

export const readTextFile = async (bucketName: string, key: string, region: string): Promise<string> => {
  const s3Client = createAwsClient(S3Client, { region });

  const response = await s3Client.send(
    new GetObjectCommand({
      Key: key,
      Bucket: bucketName,
    }),
  );

  return (await response.Body?.transformToString()) || '';
};
