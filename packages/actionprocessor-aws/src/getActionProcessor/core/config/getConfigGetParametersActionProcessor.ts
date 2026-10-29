import { qpqConfigAwsUtils } from '@qpqjs/config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askConfigGetParameters,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
} from '@qpqjs/core';

import { getParameters } from '../../../logic/parametersManager/getParameters';
import { resolveParameterKey } from '../../../runtimeConfig/resolveParameterKey';

const getProcessConfigGetParameters = (qpqConfig: QPQConfig): ProcessorFor<typeof askConfigGetParameters> => {
  return async ({ parameterNames }) => {
    const awsParameterKeys = parameterNames.map((pn) => resolveParameterKey(pn, qpqConfig));

    try {
      const parameterValues = await getParameters(awsParameterKeys, qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig));
      return actionResult(parameterValues);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        ThrottlingException: () => actionResultError(askConfigGetParameters.errorType.Throttled, 'Throttling: Rate exceeded'),
      });
    }
  };
};

export const getConfigGetParametersActionProcessor = createActionProcessor(askConfigGetParameters, getProcessConfigGetParameters);
