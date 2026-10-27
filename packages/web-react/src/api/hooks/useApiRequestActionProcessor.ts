import { createApiRequestActionProcessor } from 'quidproquo-actionprocessor-web';
import { ActionProcessorListResolver } from 'quidproquo-core';

import { useMemo, useRef } from 'react';

import { useAuthAccessToken } from '../../auth/hooks';
import { useBaseUrlResolvers } from '../../baseUrl/hooks';

export type UseApiRequestActionProcessorOptions = {
  resolveServiceBaseUrl?: (service: string) => string;

  // Extra headers to send on EVERY request (tenant ids, tracing, ...). Called
  // per request; held in a ref so the caller may pass a fresh closure each
  // render without recreating the processor. Merged UNDER the auth header, so
  // it can never clobber Authorization.
  getExtraHeaders?: () => Record<string, string>;
};

export const useApiRequestActionProcessor = (options?: UseApiRequestActionProcessorOptions): ActionProcessorListResolver => {
  const accessToken = useAuthAccessToken();
  const { getApiUrl } = useBaseUrlResolvers();

  // Hold the token in a ref so the processor closure always reads the current value.
  const tokenRef = useRef(accessToken);
  tokenRef.current = accessToken;

  const getExtraHeadersRef = useRef(options?.getExtraHeaders);
  getExtraHeadersRef.current = options?.getExtraHeaders;

  return useMemo(
    () =>
      createApiRequestActionProcessor({
        getHeaders: (): Record<string, string> => ({
          ...getExtraHeadersRef.current?.(),
          ...(tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}),
        }),
        resolveServiceBaseUrl: options?.resolveServiceBaseUrl ?? (() => getApiUrl()),
      }),
    [options?.resolveServiceBaseUrl, getApiUrl],
  );
};
