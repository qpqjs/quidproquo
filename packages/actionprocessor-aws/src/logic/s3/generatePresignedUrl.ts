import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { createAwsClient } from '../createAwsClient';

/** Presigns a GET of the object, valid for expirationMs from now. */
export const generatePresignedUrl = async (bucketName: string, objectKey: string, region: string, expirationMs: number): Promise<string> => {
  const s3Client = createAwsClient(S3Client, { region });

  const getObjectCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  return await getSignedUrl(s3Client, getObjectCommand, {
    expiresIn: expirationMs / 1000,
  });
};
