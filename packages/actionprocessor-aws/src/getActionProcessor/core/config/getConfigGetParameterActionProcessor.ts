import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askConfigGetParameter,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

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
        ThrottlingException: () => actionResultError(askConfigGetParameter.errorType.Throttling, 'Throttling: Rate exceeded'),
      });
    }
  };
};

export const getConfigGetParameterActionProcessor = createActionProcessor(askConfigGetParameter, getProcessConfigGetParameter);
