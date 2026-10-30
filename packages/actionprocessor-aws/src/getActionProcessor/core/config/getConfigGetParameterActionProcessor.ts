import { qpqConfigAwsUtils } from '@qpqjs/config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askConfigGetParameter,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  transientErrorMap,
} from '@qpqjs/core';

import { getParameter } from '../../../logic/parametersManager/getParameter';
import { resolveParameterKey } from '../../../runtimeConfig/resolveParameterKey';

const getProcessConfigGetParameter = (qpqConfig: QPQConfig): ProcessorFor<typeof askConfigGetParameter> => {
  return async ({ parameterName }) => {
    const awsParameterKey = resolveParameterKey(parameterName, qpqConfig);

    try {
      const parameterValue = await getParameter(awsParameterKey, qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig));
      return actionResult(parameterValue);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        ...transientErrorMap(),
        ThrottlingException: () => actionResultError(askConfigGetParameter.errorType.Throttled, 'Throttling: Rate exceeded'),
      });
    }
  };
};

export const getConfigGetParameterActionProcessor = createActionProcessor(askConfigGetParameter, getProcessConfigGetParameter);
