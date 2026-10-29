import { HTTPNetworkResponse, NetworkRequestActionPayload } from '@qpqjs/core';
import { performNetworkRequest } from '@qpqjs/webserver';

import { useAuthAccessToken } from '../../auth';
import { useFastCallback } from '../../hooks';

export const useAuthenticatedNetworkRequest = <R>(payload: NetworkRequestActionPayload<any>): (() => Promise<HTTPNetworkResponse<R>>) => {
  const authToken = useAuthAccessToken();

  const payloadWithAuthHeaders: NetworkRequestActionPayload<any> = authToken
    ? {
        ...payload,
        headers: {
          ...(payload.headers || {}),
          Authorization: `Bearer ${authToken}`,
        },
      }
    : payload;

  const requeser = useFastCallback(() => performNetworkRequest<R>(payloadWithAuthHeaders));

  return requeser;
};
