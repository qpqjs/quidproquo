// @vitest-environment jsdom
import { ApiActionType, askApiRequestBase, NetworkRequestError, NetworkRequestErrorCode } from '@qpqjs/webserver';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApiRequestActionProcessor, getApiRequestActionProcessor } from './createApiRequestActionProcessor';

const preformNetworkRequest = vi.hoisted(() => vi.fn());

vi.mock('@qpqjs/webserver', async (importOriginal: <T>() => Promise<T>) => ({
  ...(await importOriginal<typeof import('@qpqjs/webserver')>()),
  preformNetworkRequest,
}));

const buildRequest = () => ({
  service: 'orders',
  endpoint: '/orders',
  method: 'GET' as const,
  body: undefined,
  params: { page: '1' },
  headers: { 'x-call': 'call' },
  responseType: 'json' as const,
});

const getProcessor = async (resolver = getApiRequestActionProcessor) => {
  const processors = await resolver(undefined as any, undefined as any);
  return processors[ApiActionType.Request] as (p: any, ...rest: any[]) => Promise<any>;
};

describe('createApiRequestActionProcessor', () => {
  beforeEach(() => {
    preformNetworkRequest.mockResolvedValue({ status: 200, data: 'ok' });
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns the network response in the action result', async () => {
    const processor = await getProcessor();

    const [result] = await processor(buildRequest());

    expect(result).toEqual({ status: 200, data: 'ok' });
  });

  it('defaults the base url to api.<host> when no resolver is supplied', async () => {
    const { protocol, hostname, port } = window.location;
    const processor = await getProcessor();

    await processor(buildRequest());

    expect(preformNetworkRequest).toHaveBeenCalledWith(
      expect.objectContaining({ basePath: `${protocol}//api.${hostname}${port ? `:${port}` : ''}` }),
    );
  });

  it('uses a custom service base url resolver', async () => {
    const resolveServiceBaseUrl = vi.fn((service: string) => `https://${service}.test`);
    const processor = await getProcessor(createApiRequestActionProcessor({ resolveServiceBaseUrl }));

    await processor(buildRequest());

    expect(resolveServiceBaseUrl).toHaveBeenCalledWith('orders');
    expect(preformNetworkRequest).toHaveBeenCalledWith(expect.objectContaining({ basePath: 'https://orders.test' }));
  });

  it('merges per-call headers with the provided getHeaders, letting getHeaders win', async () => {
    const getHeaders = vi.fn(() => ({ 'x-call': 'override', authorization: 'Bearer t' }));
    const processor = await getProcessor(createApiRequestActionProcessor({ getHeaders }));

    await processor(buildRequest());

    expect(preformNetworkRequest).toHaveBeenCalledWith(expect.objectContaining({ headers: { 'x-call': 'override', authorization: 'Bearer t' } }));
  });

  const rejectWith = async (error: unknown) => {
    preformNetworkRequest.mockRejectedValue(error);
    const processor = await getProcessor();
    const [, actionError] = await processor(buildRequest());
    return actionError;
  };

  it('maps a timeout to the Timeout error type', async () => {
    const error = await rejectWith(new NetworkRequestError(NetworkRequestErrorCode.timeout, 'Network request timed out'));

    expect(error.errorType).toBe(askApiRequestBase.errorType.Timeout);
  });

  it('maps an unsupported method to the UnsupportedMethod error type with its message', async () => {
    const error = await rejectWith(new NetworkRequestError(NetworkRequestErrorCode.unsupportedMethod, 'Request method not implemented [CONNECT]'));

    expect(error.errorType).toBe(askApiRequestBase.errorType.UnsupportedMethod);
    expect(error.errorText).toBe('Request method not implemented [CONNECT]');
  });

  it('maps any other transport failure to the NetworkError error type with its message', async () => {
    const error = await rejectWith(new NetworkRequestError(NetworkRequestErrorCode.network, 'Failed to fetch'));

    expect(error.errorType).toBe(askApiRequestBase.errorType.NetworkError);
    expect(error.errorText).toBe('Failed to fetch');
  });
});
