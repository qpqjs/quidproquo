import { HTTPNetworkResponse, NetworkRequestActionPayload } from '@qpqjs/core';
import { preformNetworkRequest } from '@qpqjs/webserver';

import { useFastCallback } from '../../hooks';

export const useNetworkRequest = <R>(payload: NetworkRequestActionPayload<any>): (() => Promise<HTTPNetworkResponse<R>>) => {
  const requeser = useFastCallback(() => preformNetworkRequest<R>(payload));

  return requeser;
};
