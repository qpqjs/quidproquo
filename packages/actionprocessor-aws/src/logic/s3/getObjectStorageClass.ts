import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { createAwsClient } from '../createAwsClient';

export const getObjectStorageClass = async (bucketName: string, key: string, region: string): Promise<'cold_storage' | 'standard'> => {
  const s3Client = createAwsClient(S3Client, { region });

  const response = await s3Client.send(
    new HeadObjectCommand({
      Key: key,
      Bucket: bucketName,
    }),
  );

  // Map AWS StorageClass to our custom labels
  switch (response.StorageClass) {
    case 'GLACIER':
    case 'GLACIER_IR':
    case 'DEEP_ARCHIVE':
    case 'ONEZONE_IA':
    case 'EXPRESS_ONEZONE':
    case 'OUTPOSTS':
    case 'SNOW':
      return 'cold_storage';

    case 'STANDARD_IA':
    case 'STANDARD':
    case 'INTELLIGENT_TIERING':
    case 'REDUCED_REDUNDANCY':
    default:
      return 'standard';
  }
};
