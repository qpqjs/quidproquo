import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

import { createAwsClient } from '../createAwsClient';

/** JSON-serialises the payload and posts it to one websocket connection. */
export const sendMessageToWebSocketConnection = async (apiId: string, connectionId: string, region: string, payload: unknown): Promise<void> => {
  const apiGatewayManagementApiClient = createAwsClient(ApiGatewayManagementApiClient, {
    apiVersion: '2018-11-29',
    // QPQ deploys every websocket api with a single stage named 'prod' (see the CDK
    // websocket construct), so the management endpoint stage is fixed.
    endpoint: `https://${apiId}.execute-api.${region}.amazonaws.com/prod`,
    region,
  });

  await apiGatewayManagementApiClient.send(
    new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: JSON.stringify(payload),
    }),
  );
};
