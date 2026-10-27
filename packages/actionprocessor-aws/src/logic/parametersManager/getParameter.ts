import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

import { memoFuncAsync } from '../cache/memoFuncAsync';
import { createAwsClient } from '../createAwsClient';

export const getParameter = memoFuncAsync(async (parameterName: string, region: string): Promise<string> => {
  const ssmClient = createAwsClient(SSMClient, { region });

  const response = await ssmClient.send(
    new GetParameterCommand({
      Name: parameterName,
    }),
  );

  return response.Parameter?.Value || '';
}, 60);
