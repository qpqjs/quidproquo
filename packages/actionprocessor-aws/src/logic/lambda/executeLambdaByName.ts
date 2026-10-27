import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

import { createAwsClient } from '../createAwsClient';

/**
 * Invokes a lambda with a JSON payload. isAsync = fire-and-forget (Event invocation,
 * always resolves undefined); otherwise waits and returns the parsed response payload.
 */
export const executeLambdaByName = async <R>(functionName: string, region: string, payload: unknown, isAsync: boolean): Promise<R | undefined> => {
  const lambdaClient = createAwsClient(LambdaClient, { region });

  const encoder = new TextEncoder();
  const encodedPayload = encoder.encode(JSON.stringify(payload));

  const response = await lambdaClient.send(
    new InvokeCommand({
      FunctionName: functionName,
      Payload: encodedPayload,
      InvocationType: isAsync ? 'Event' : 'RequestResponse',
    }),
  );

  if (response.FunctionError) {
    // On function errors the payload carries the thrown error details
    const errorDetails = response.Payload ? new TextDecoder().decode(response.Payload) : '';
    throw new Error(`Lambda Error: ${response.FunctionError}. Details: ${errorDetails}`);
  }

  if (!isAsync && response.Payload) {
    const jsonString = new TextDecoder().decode(response.Payload);
    if (jsonString) {
      return JSON.parse(jsonString);
    }
  }

  return undefined;
};
