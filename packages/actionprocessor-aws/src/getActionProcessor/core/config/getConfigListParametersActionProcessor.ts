import { actionResult, askConfigListParameters, createActionProcessor, ProcessorFor, QPQConfig, qpqCoreUtils } from '@qpqjs/core';

const getProcessConfigListParameters = (qpqConfig: QPQConfig): ProcessorFor<typeof askConfigListParameters> => {
  const paramConfigs = qpqCoreUtils.getOwnedParameterConfigs(qpqConfig).map((pc) => pc.key);
  return async () => {
    return actionResult(paramConfigs);
  };
};

export const getConfigListParametersActionProcessor = createActionProcessor(askConfigListParameters, getProcessConfigListParameters);
