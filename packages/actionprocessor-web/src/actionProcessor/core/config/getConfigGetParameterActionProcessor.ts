import {
  actionResult,
  actionResultError,
  askConfigGetParameter,
  createActionProcessor,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

const getProcessConfigGetParameter = (qpqConfig: QPQConfig): ProcessorFor<typeof askConfigGetParameter> => {
  return async ({ parameterName }) => {
    // window.localStorage (not the bare global): Node exposes a non-functional
    // localStorage global that shadows jsdom's in tests.
    const parameterValue = window.localStorage.getItem(parameterName);

    if (parameterValue === null) {
      return actionResultError(ErrorTypeEnum.NotFound, `Parameter '${parameterName}' not found in Local Storage`);
    }

    return actionResult(parameterValue);
  };
};

export const getConfigGetParameterActionProcessor = createActionProcessor(askConfigGetParameter, getProcessConfigGetParameter);
