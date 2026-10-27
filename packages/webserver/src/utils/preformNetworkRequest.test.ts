import type { NetworkRequestActionPayload } from '@qpqjs/core';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { NetworkRequestError, NetworkRequestErrorCode } from './NetworkRequestError';
import { preformNetworkRequest } from './preformNetworkRequest';

const { executeNetworkRequest } = vi.hoisted(() => ({ executeNetworkRequest: vi.fn() }));

vi.mock('./networkRequestUtils', () => ({ executeNetworkRequest }));

const buildPayload = (overrides: Partial<NetworkRequestActionPayload<any>> = {}): NetworkRequestActionPayload<any> =>
  ({
    url: '/resource',
    basePath: 'https://api.example.com',
    method: 'GET',
    headers: { authorization: 'token' },
    params: { page: '1' },
    responseType: 'json',
    ...overrides,
  }) as NetworkRequestActionPayload<any>;

const rejectWith = async (error: unknown): Promise<NetworkRequestError> => {
  executeNetworkRequest.mockRejectedValue(error);

  try {
    await preformNetworkRequest(buildPayload());
  } catch (caught) {
    expect(caught).toBeInstanceOf(NetworkRequestError);
    return caught as NetworkRequestError;
  }

  throw new Error('expected preformNetworkRequest to throw');
};

afterEach(() => {
  executeNetworkRequest.mockReset();
});

describe('preformNetworkRequest', () => {
  it('returns the executed network response, whatever its status', async () => {
    const response = { headers: {}, setCookies: [], status: 503, statusText: 'Service Unavailable', data: 'down' };
    executeNetworkRequest.mockResolvedValue(response);

    const payload = buildPayload();
    const result = await preformNetworkRequest(payload);

    expect(executeNetworkRequest).toHaveBeenCalledWith(payload);
    expect(result).toEqual(response);
  });

  it('maps an abort to a timeout error', async () => {
    const error = await rejectWith(Object.assign(new Error('aborted'), { name: 'AbortError' }));

    expect(error.code).toBe(NetworkRequestErrorCode.timeout);
  });

  it('passes an unsupported-method error through unchanged', async () => {
    const thrown = new NetworkRequestError(NetworkRequestErrorCode.unsupportedMethod, 'Request method not implemented [CONNECT]');

    const error = await rejectWith(thrown);

    expect(error).toBe(thrown);
  });

  it('wraps any other failure as a network error carrying its message', async () => {
    const error = await rejectWith(new TypeError('Failed to fetch'));

    expect(error.code).toBe(NetworkRequestErrorCode.network);
    expect(error.message).toBe('Failed to fetch');
  });

  it('stringifies a non-Error rejection', async () => {
    const error = await rejectWith('offline');

    expect(error.code).toBe(NetworkRequestErrorCode.network);
    expect(error.message).toBe('offline');
  });
});
