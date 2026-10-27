import { S3Client } from '@aws-sdk/client-s3';
import { HeadObjectCommand } from '@aws-sdk/client-s3';

import { createAwsClient } from '../createAwsClient';

export const objectExists = async (bucketName: string, key: string, region: string): Promise<boolean> => {
  const s3Client = createAwsClient(S3Client, { region });

  try {
    await s3Client.send(
      new HeadObjectCommand({
        Key: key,
        Bucket: bucketName,
      }),
    );

    return true;
  } catch (error: any) {
    // A 404 is a definitive "does not exist"; anything else (access denied,
    // throttling, ...) must surface rather than masquerade as a missing file.
    if (error?.name === 'NotFound' || error?.$metadata?.httpStatusCode === 404) {
      return false;
    }

    throw error;
  }
};
