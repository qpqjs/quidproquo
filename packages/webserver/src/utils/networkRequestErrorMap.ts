import { actionResultError } from '@qpqjs/core';

import { NetworkRequestErrorCode } from './NetworkRequestError';
import { NetworkRequestErrorTypes } from './NetworkRequestErrorTypes';

/** The caught-error map every processor built on performNetworkRequest shares, keyed on NetworkRequestError.code. */
export const networkRequestErrorMap = (errorType: NetworkRequestErrorTypes) => ({
  [NetworkRequestErrorCode.timeout]: () => actionResultError(errorType.Timeout, 'Network request timed out'),
  [NetworkRequestErrorCode.unsupportedMethod]: (error: Error) => actionResultError(errorType.UnsupportedMethod, error.message),
  [NetworkRequestErrorCode.network]: (error: Error) => actionResultError(errorType.NetworkError, error.message),
});
