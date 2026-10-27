import { askNetworkRequestBase, buildTestQpqConfig, NetworkActionType, resolveActionResult, resolveActionResultError } from '@qpqjs/core';
import { NetworkRequestError, NetworkRequestErrorCode } from '@qpqjs/webserver';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { getNetworkRequestActionProcessor } from './getNetworkRequestActionProcessor';

const { preformNetworkRequest } = vi.hoisted(() => ({ preformNetworkRequest: vi.fn() }));

vi.mock('@qpqjs/webserver', async (importOriginal: <T>() => Promise<T>) => ({
  ...(await importOriginal<typeof import('@qpqjs/webserver')>()),
  preformNetworkRequest,
}));

describe('getNetworkRequestActionProcessor', () => {
  const resolve = async () =>
    (await getNetworkRequestActionProcessor(buildTestQpqConfig(), async () => null))[NetworkActionType.Request] as (
      p: any,
      ...rest: any[]
    ) => Promise<any>;

  const rejectWith = async (error: unknown) => {
    preformNetworkRequest.mockRejectedValue(error);
    const processor = await resolve();
    return resolveActionResultError(await processor({ method: 'GET', url: '/x', responseType: 'json' }));
  };

  afterEach(() => {
    vi.restoreAllMocks();
    preformNetworkRequest.mockReset();
  });

  it('wraps the network response in a successful action result', async () => {
    const response = { headers: { 'content-type': 'application/json' }, status: 200, statusText: 'OK', data: { hello: 'world' } };
    preformNetworkRequest.mockResolvedValue(response);
    const processor = await resolve();

    const result = await processor({ method: 'GET', url: '/users', responseType: 'json' });

    expect(preformNetworkRequest).toHaveBeenCalledWith({ method: 'GET', url: '/users', responseType: 'json' });
    expect(resolveActionResult(result)).toEqual(response);
  });

  it('maps a timeout to the Timeout error type', async () => {
    const error = await rejectWith(new NetworkRequestError(NetworkRequestErrorCode.timeout, 'Network request timed out'));

    expect(error.errorType).toBe(askNetworkRequestBase.errorType.Timeout);
  });

  it('maps an unsupported method to the UnsupportedMethod error type with its message', async () => {
    const error = await rejectWith(new NetworkRequestError(NetworkRequestErrorCode.unsupportedMethod, 'Request method not implemented [CONNECT]'));

    expect(error.errorType).toBe(askNetworkRequestBase.errorType.UnsupportedMethod);
    expect(error.errorText).toBe('Request method not implemented [CONNECT]');
  });

  it('maps any other transport failure to the NetworkError error type with its message', async () => {
    const error = await rejectWith(new NetworkRequestError(NetworkRequestErrorCode.network, 'Failed to fetch'));

    expect(error.errorType).toBe(askNetworkRequestBase.errorType.NetworkError);
    expect(error.errorText).toBe('Failed to fetch');
  });
});
