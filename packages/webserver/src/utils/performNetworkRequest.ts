import { HTTPNetworkResponse, NetworkRequestActionPayload } from '@qpqjs/core';

import { NetworkRequestError, NetworkRequestErrorCode } from './NetworkRequestError';
import { executeNetworkRequest } from './networkRequestUtils';

const toNetworkRequestError = (error: unknown): NetworkRequestError => {
  if (error instanceof NetworkRequestError) {
    return error;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new NetworkRequestError(NetworkRequestErrorCode.timeout, 'Network request timed out');
  }

  const message = error instanceof Error ? error.message : String(error);
  return new NetworkRequestError(NetworkRequestErrorCode.network, message);
};

/**
 * Resolves with whatever HTTP response came back, any status, and throws a
 * NetworkRequestError when no response came back at all. Its `code` is what the
 * network and api action processors map onto their error catalogs.
 */
export const performNetworkRequest = async <R>(payload: NetworkRequestActionPayload<any>): Promise<HTTPNetworkResponse<R>> => {
  try {
    return await executeNetworkRequest<R>(payload);
  } catch (error: unknown) {
    throw toNetworkRequestError(error);
  }
};
