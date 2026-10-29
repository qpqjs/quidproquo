import { ParameterType, PutParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

import { createAwsClient } from '../createAwsClient';

export const setParameter = async (parameterName: string, region: string, value: string): Promise<void> => {
  const ssmClient = createAwsClient(SSMClient, { region });

  await ssmClient.send(
    new PutParameterCommand({
      Name: parameterName,
      Value: value,
      Overwrite: true,
      Type: ParameterType.STRING,
    }),
  );
};
