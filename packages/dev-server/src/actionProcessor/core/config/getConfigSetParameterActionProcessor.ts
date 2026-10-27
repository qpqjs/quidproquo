import {
  actionResult,
  actionResultErrorFromCaughtError,
  askConfigSetParameter,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { setParameterValue } from '../../../logic/config';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessConfigSetParameter = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig): ProcessorFor<typeof askConfigSetParameter> => {
  return async ({ parameterName, parameterValue }) => {
    try {
      await setParameterValue(devServerConfig.runtimePath, parameterName, qpqConfig, parameterValue);
      return actionResult(undefined);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {});
    }
  };
};

export const getConfigSetParameterActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askConfigSetParameter, (qpqConfig) => getProcessConfigSetParameter(qpqConfig, devServerConfig));
