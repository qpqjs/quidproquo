import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askConfigGetSecret,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { getSecret } from '../../../logic/secretsManager/getSecret';
import { resolveSecretResourceName } from './utils';

const getProcessConfigGetSecret = (qpqConfig: QPQConfig): ProcessorFor<typeof askConfigGetSecret> => {
  return async ({ secretName }) => {
    const awsSecretKey = resolveSecretResourceName(secretName, qpqConfig);

    try {
      const secretValue = await getSecret(awsSecretKey, qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig));
      return actionResult(secretValue);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        ResourceNotFoundException: () => actionResultError(askConfigGetSecret.errorType.ResourceNotFound, `Secret not found: [${secretName}]`),
        ThrottlingException: () => actionResultError(askConfigGetSecret.errorType.Throttling, 'Throttling: Rate exceeded'),
      });
    }
  };
};

export const getConfigGetSecretActionProcessor = createActionProcessor(askConfigGetSecret, getProcessConfigGetSecret);
