import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

import { memoFuncAsync } from '../cache/memoFuncAsync';
import { createAwsClient } from '../createAwsClient';

export const getSecret = memoFuncAsync(async (secretName: string, region: string): Promise<string> => {
  const secretsManagerClient = createAwsClient(SecretsManagerClient, {
    region,
  });

  const response = await secretsManagerClient.send(
    new GetSecretValueCommand({
      SecretId: secretName,
    }),
  );

  if (!response.SecretString) {
    throw new Error(`Failed to get secret value for secret name: [${secretName}]`);
  }

  return response.SecretString;
}, 60);
