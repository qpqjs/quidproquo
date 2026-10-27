import { actionResult, actionResultErrorFromCaughtError, askConfigGetSecret, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { getOrSeedSecretValue } from '../../../logic/config';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessConfigGetSecret = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig): ProcessorFor<typeof askConfigGetSecret> => {
  return async ({ secretName }) => {
    try {
      const secretValue = await getOrSeedSecretValue(devServerConfig.runtimePath, secretName, qpqConfig);
      return actionResult(secretValue);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {});
    }
  };
};

export const getConfigGetSecretActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askConfigGetSecret, (qpqConfig) => getProcessConfigGetSecret(qpqConfig, devServerConfig));
