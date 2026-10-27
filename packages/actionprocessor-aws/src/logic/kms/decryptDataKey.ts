import { CryptoContext } from 'quidproquo-core';

import { DecryptCommand, KMSClient } from '@aws-sdk/client-kms';

import { createAwsClient } from '../createAwsClient';
import { toKmsEncryptionContext } from './toKmsEncryptionContext';

// The wrapped key embeds the CMK id, so no KeyId is needed; the
// EncryptionContext must match the one used at GenerateDataKey time (this is
// also what puts the per-context decrypt entry in CloudTrail).
export const decryptDataKey = async (wrappedKey: Buffer, context: CryptoContext, region: string): Promise<Buffer> => {
  const kmsClient = createAwsClient(KMSClient, {
    region,
  });

  const response = await kmsClient.send(
    new DecryptCommand({
      CiphertextBlob: wrappedKey,
      EncryptionContext: toKmsEncryptionContext(context),
    }),
  );

  if (!response.Plaintext) {
    throw new Error('KMS returned no plaintext for the wrapped data key');
  }

  return Buffer.from(response.Plaintext);
};
