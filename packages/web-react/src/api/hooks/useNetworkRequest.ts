import { HTTPNetworkResponse, NetworkRequestActionPayload } from '@qpqjs/core';
import { performNetworkRequest } from '@qpqjs/webserver';

import { useFastCallback } from '../../hooks';

export const useNetworkRequest = <R>(payload: NetworkRequestActionPayload<any>): (() => Promise<HTTPNetworkResponse<R>>) => {
  const requeser = useFastCallback(() => performNetworkRequest<R>(payload));

  return requeser;
};
