import { qpqConfigAwsUtils } from '@qpqjs/config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askConfigSetParameter,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  transientErrorMap,
} from '@qpqjs/core';

import { setParameter } from '../../../logic/parametersManager/setParameter';
import { resolveParameterKey } from '../../../runtimeConfig/resolveParameterKey';

const getProcessConfigSetParameter = (qpqConfig: QPQConfig): ProcessorFor<typeof askConfigSetParameter> => {
  return async ({ parameterName, parameterValue }) => {
    const awsParameterKey = resolveParameterKey(parameterName, qpqConfig);

    try {
      await setParameter(awsParameterKey, qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig), parameterValue);
      return actionResult(undefined);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        ...transientErrorMap(),
        ThrottlingException: () => actionResultError(askConfigSetParameter.errorType.Throttled, 'Throttling: Rate exceeded'),
        ParameterLimitExceeded: () => actionResultError(askConfigSetParameter.errorType.QuotaExceeded, 'Parameter store limit exceeded'),
      });
    }
  };
};

export const getConfigSetParameterActionProcessor = createActionProcessor(askConfigSetParameter, getProcessConfigSetParameter);
