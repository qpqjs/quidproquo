import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askNetworkRequestBase,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
} from '@qpqjs/core';
import { NetworkRequestErrorCode, performNetworkRequest } from '@qpqjs/webserver';

const getProcessNetworkRequest = (qpqConfig: QPQConfig): ProcessorFor<typeof askNetworkRequestBase> => {
  return async (payload) => {
    try {
      return actionResult(await performNetworkRequest(payload));
    } catch (error: unknown) {
      // Keyed on NetworkRequestError.code, which the mapper checks before the error name.
      return actionResultErrorFromCaughtError(error, {
        [NetworkRequestErrorCode.timeout]: () => actionResultError(askNetworkRequestBase.errorType.Timeout, 'Network request timed out'),
        [NetworkRequestErrorCode.unsupportedMethod]: (error) => actionResultError(askNetworkRequestBase.errorType.UnsupportedMethod, error.message),
        [NetworkRequestErrorCode.network]: (error) => actionResultError(askNetworkRequestBase.errorType.NetworkError, error.message),
      });
    }
  };
};

export const getNetworkRequestActionProcessor = createActionProcessor(askNetworkRequestBase, getProcessNetworkRequest);
