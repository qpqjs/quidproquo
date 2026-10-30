import { actionResult, actionResultErrorFromCaughtError, askConfigGetParameter, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

import { getOrSeedParameterValue } from '../../../logic/config';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessConfigGetParameter = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig): ProcessorFor<typeof askConfigGetParameter> => {
  return async ({ parameterName }) => {
    try {
      const parameterValue = await getOrSeedParameterValue(devServerConfig.runtimePath, parameterName, qpqConfig);
      return actionResult(parameterValue);
    } catch (error: unknown) {
      // No local failure maps to a catalog entry here; anything thrown becomes GenericError.
      return actionResultErrorFromCaughtError(error);
    }
  };
};

export const getConfigGetParameterActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askConfigGetParameter, (qpqConfig) => getProcessConfigGetParameter(qpqConfig, devServerConfig));
