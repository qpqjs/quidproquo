import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askNetworkRequestBase,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
} from '@qpqjs/core';
import { networkRequestErrorMap, performNetworkRequest } from '@qpqjs/webserver';

const getProcessNetworkRequest = (qpqConfig: QPQConfig): ProcessorFor<typeof askNetworkRequestBase> => {
  return async (payload) => {
    try {
      return actionResult(await performNetworkRequest(payload));
    } catch (error: unknown) {
      // Keyed on NetworkRequestError.code, which the mapper checks before the error name.
      return actionResultErrorFromCaughtError(error, networkRequestErrorMap(askNetworkRequestBase.errorType));
    }
  };
};

export const getNetworkRequestActionProcessor = createActionProcessor(askNetworkRequestBase, getProcessNetworkRequest);
