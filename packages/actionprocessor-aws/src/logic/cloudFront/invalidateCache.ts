import crypto from 'crypto';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

import { createAwsClient } from '../createAwsClient';

// CloudFront dedupes CreateInvalidation calls by CallerReference, so it must be unique
// per request: hash of the paths plus the current time.
const getInvalidationCallerReference = (paths: string[]): string => {
  const allPathHash = crypto.createHash('md5').update(paths.join('')).digest('hex');

  return allPathHash + new Date().toISOString();
};

export const invalidateCache = async (distributionId: string, region: string, paths: string[]): Promise<void> => {
  const cloudFrontClient = createAwsClient(CloudFrontClient, { region });

  await cloudFrontClient.send(
    new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        Paths: {
          Quantity: paths.length,
          Items: paths,
        },
        CallerReference: getInvalidationCallerReference(paths),
      },
    }),
  );
};
