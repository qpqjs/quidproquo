import { GetParametersCommand, SSMClient } from '@aws-sdk/client-ssm';

import { memoFuncAsync } from '../cache/memoFuncAsync';
import { createAwsClient } from '../createAwsClient';

export const getParameters = memoFuncAsync(async (parameterNames: string[], region: string): Promise<string[]> => {
  const ssmClient = createAwsClient(SSMClient, { region });

  const response = await ssmClient.send(
    new GetParametersCommand({
      Names: parameterNames,
    }),
  );

  const resolvedParams = response.Parameters || [];

  // Preserve the requested order; a missing parameter resolves to an empty string
  return parameterNames.map((parameterName) => resolvedParams.find((resolvedParam) => resolvedParam.Name === parameterName)?.Value || '');
}, 60);
