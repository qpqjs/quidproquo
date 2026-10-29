import { APIGatewayClient, GetApiKeyCommand } from '@aws-sdk/client-api-gateway';

import { createAwsClient } from '../createAwsClient';

// Fetch a single api key's value by id - keys are read individually (not listed) so the
// IAM grant can be scoped per-key with tag conditions rather than the /apikeys collection.
export const getApiKeyValue = async (region: string, apiKeyId: string): Promise<string | undefined> => {
  const apiGatewayClient = createAwsClient(APIGatewayClient, { region });

  const res = await apiGatewayClient.send(
    new GetApiKeyCommand({
      apiKey: apiKeyId,
      includeValue: true,
    }),
  );

  return res.value;
};
