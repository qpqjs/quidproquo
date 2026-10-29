import {
  ActionProcessorList,
  ActionProcessorListResolver,
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  Nullable,
  ProcessorFor,
} from '@qpqjs/core';
import { ApiActionType, askApiRequestBase, NetworkRequestErrorCode, performNetworkRequest } from '@qpqjs/webserver';

export type ApiRequestActionProcessorOptions = {
  // Resolve the base url for a given service. The default ignores the service name
  // and targets api.<currentHost>, the single-backend case that covers most apps.
  resolveServiceBaseUrl?: (service: string) => string;

  // Provide headers to attach to every request, e.g. auth (any scheme), tracing,
  // tenant ids. Merged into (and overriding) the per-call headers. Default: none.
  getHeaders?: () => Nullable<Record<string, string>>;
};

const defaultResolveServiceBaseUrl = (_service: string): string => {
  const { protocol, hostname, port } = window.location;
  return `${protocol}//api.${hostname}${port ? `:${port}` : ''}`;
};

const getProcessApiRequest = (options?: ApiRequestActionProcessorOptions): ProcessorFor<typeof askApiRequestBase> => {
  return async ({ service, endpoint, method, body, params, headers, responseType }) => {
    const basePath = (options?.resolveServiceBaseUrl ?? defaultResolveServiceBaseUrl)(service);

    try {
      const res = await performNetworkRequest({
        url: endpoint,
        basePath,
        method,
        body,
        params,
        responseType,
        headers: {
          ...headers,
          ...options?.getHeaders?.(),
        },
      });

      return actionResult(res);
    } catch (error: unknown) {
      // Keyed on NetworkRequestError.code, which the mapper checks before the error name.
      return actionResultErrorFromCaughtError(error, {
        [NetworkRequestErrorCode.timeout]: () => actionResultError(askApiRequestBase.errorType.Timeout, 'Network request timed out'),
        [NetworkRequestErrorCode.unsupportedMethod]: (error) => actionResultError(askApiRequestBase.errorType.UnsupportedMethod, error.message),
        [NetworkRequestErrorCode.network]: (error) => actionResultError(askApiRequestBase.errorType.NetworkError, error.message),
      });
    }
  };
};

export const createApiRequestActionProcessor =
  (options?: ApiRequestActionProcessorOptions): ActionProcessorListResolver =>
  async (): Promise<ActionProcessorList> => ({
    [ApiActionType.Request]: getProcessApiRequest(options),
  });

// Zero-config default registered in the standard web processors.
export const getApiRequestActionProcessor: ActionProcessorListResolver = createApiRequestActionProcessor();
