import { HTTPNetworkResponse, NetworkRequestActionPayload } from 'quidproquo-core';
import { preformNetworkRequest } from 'quidproquo-webserver';

import { useFastCallback } from '../../hooks';

export const useNetworkRequest = <R>(payload: NetworkRequestActionPayload<any>): (() => Promise<HTTPNetworkResponse<R>>) => {
  const requeser = useFastCallback(() => preformNetworkRequest<R>(payload));

  return requeser;
};
