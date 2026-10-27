import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askConfigSetParameter,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

const getProcessConfigSetParameter = (qpqConfig: QPQConfig): ProcessorFor<typeof askConfigSetParameter> => {
  return async ({ parameterName, parameterValue }) => {
    try {
      // window.localStorage (not the bare global): Node exposes a non-functional
      // localStorage global that shadows jsdom's in tests.
      window.localStorage.setItem(parameterName, parameterValue);

      return actionResult(void 0);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        QuotaExceededError: () =>
          actionResultError(askConfigSetParameter.errorType.QuotaExceeded, `Local Storage quota exceeded saving parameter '${parameterName}'.`),
      });
    }
  };
};

export const getConfigSetParameterActionProcessor = createActionProcessor(askConfigSetParameter, getProcessConfigSetParameter);
