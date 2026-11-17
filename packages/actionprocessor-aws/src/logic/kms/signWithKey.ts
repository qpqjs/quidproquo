import { RS256_KMS_SIGNING_ALGORITHM } from '@qpqjs/actionprocessor-node';

import { KMSClient, SignCommand } from '@aws-sdk/client-kms';

import { createAwsClient } from '../createAwsClient';

// One kms:Sign per call: the private key never leaves KMS, so there is nothing
// to cache here. Takes the exact bytes to sign and returns the raw signature bytes.
export const signWithKey = async (keyAlias: string, message: Buffer, region: string): Promise<Buffer> => {
  const kmsClient = createAwsClient(KMSClient, {
    region,
  });

  const response = await kmsClient.send(
    new SignCommand({
      KeyId: keyAlias,
      Message: message,
      MessageType: 'RAW',
      SigningAlgorithm: RS256_KMS_SIGNING_ALGORITHM,
    }),
  );

  if (!response.Signature) {
    throw new Error(`KMS returned no signature for [${keyAlias}]`);
  }

  return Buffer.from(response.Signature);
};
