import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askConfigSetParameter,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { setParameter } from '../../../logic/parametersManager/setParameter';
import { resolveParameterKey } from '../../../runtimeConfig/resolveParameterKey';

const getProcessConfigSetParameter = (qpqConfig: QPQConfig): ProcessorFor<typeof askConfigSetParameter> => {
  return async ({ parameterName, parameterValue }) => {
    const awsParameterKey = resolveParameterKey(parameterName, qpqConfig);

    try {
      await setParameter(awsParameterKey, qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig), parameterValue);
      return actionResult(void 0);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        ThrottlingException: () => actionResultError(askConfigSetParameter.errorType.Throttling, 'Throttling: Rate exceeded'),
        ParameterLimitExceeded: () => actionResultError(askConfigSetParameter.errorType.QuotaExceeded, 'Parameter store limit exceeded'),
      });
    }
  };
};

export const getConfigSetParameterActionProcessor = createActionProcessor(askConfigSetParameter, getProcessConfigSetParameter);
