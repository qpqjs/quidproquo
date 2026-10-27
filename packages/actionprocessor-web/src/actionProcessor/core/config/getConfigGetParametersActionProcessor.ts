import {
  actionResult,
  actionResultError,
  askConfigGetParameters,
  createActionProcessor,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

const getProcessConfigGetParameters = (qpqConfig: QPQConfig): ProcessorFor<typeof askConfigGetParameters> => {
  return async ({ parameterNames }) => {
    // window.localStorage (not the bare global): Node exposes a non-functional
    // localStorage global that shadows jsdom's in tests.
    const parameterValues = parameterNames.map((name) => ({
      name,
      value: window.localStorage.getItem(name),
    }));

    const missingNames = parameterValues.filter((param) => param.value === null).map((param) => param.name);
    if (missingNames.length > 0) {
      return actionResultError(ErrorTypeEnum.NotFound, `Parameters not found in Local Storage: ${missingNames.join(', ')}`);
    }

    return actionResult(parameterValues.map((param) => param.value as string));
  };
};

export const getConfigGetParametersActionProcessor = createActionProcessor(askConfigGetParameters, getProcessConfigGetParameters);
