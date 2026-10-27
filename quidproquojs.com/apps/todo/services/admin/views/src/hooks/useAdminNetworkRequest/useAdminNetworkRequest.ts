import { useAuthenticatedNetworkRequest } from '@qpqjs/web-react';

import { getBaseUrlFromAdminWebHost } from './logic/getBaseUrlFromAdminWebHost';
import { AdminNetworkRequestPayload } from './types/AdminNetworkRequestPayload';

export function useAdminNetworkRequest<R>(
  payload: AdminNetworkRequestPayload
): ReturnType<typeof useAuthenticatedNetworkRequest<R>> {
  return useAuthenticatedNetworkRequest<R>({
    ...payload,
    responseType: 'json',
    basePath: `${getBaseUrlFromAdminWebHost()}/${payload.service}`,
    headers: {
      ...(payload.headers || {}),
      'content-type': 'application/json',
    },
  });
}
