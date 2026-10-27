import { GeneratedDataKey } from 'quidproquo-actionprocessor-node';
import { CryptoContext } from 'quidproquo-core';

import { GenerateDataKeyCommand, KMSClient } from '@aws-sdk/client-kms';

import { createAwsClient } from '../createAwsClient';
import { toKmsEncryptionContext } from './toKmsEncryptionContext';

export const generateDataKey = async (keyAlias: string, context: CryptoContext, region: string): Promise<GeneratedDataKey> => {
  const kmsClient = createAwsClient(KMSClient, {
    region,
  });

  const response = await kmsClient.send(
    new GenerateDataKeyCommand({
      KeyId: keyAlias,
      KeySpec: 'AES_256',
      EncryptionContext: toKmsEncryptionContext(context),
    }),
  );

  if (!response.Plaintext || !response.CiphertextBlob) {
    throw new Error(`KMS returned an incomplete data key for [${keyAlias}]`);
  }

  return {
    plaintextKey: Buffer.from(response.Plaintext),
    wrappedKey: Buffer.from(response.CiphertextBlob),
  };
};
