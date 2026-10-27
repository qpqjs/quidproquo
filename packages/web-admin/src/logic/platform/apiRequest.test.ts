import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiRequestGet, apiRequestPost, externalRequestGet } from './apiRequest';

const { preformNetworkRequest } = vi.hoisted(() => ({ preformNetworkRequest: vi.fn() }));

vi.mock('quidproquo-webserver', () => ({ preformNetworkRequest }));

const okResponse = (data: unknown) => ({ headers: {}, status: 200, statusText: 'OK', data });

afterEach(() => {
  vi.clearAllMocks();
});

describe('apiRequestPost', () => {
  it('posts the body and returns the response data', async () => {
    preformNetworkRequest.mockResolvedValue(okResponse({ ok: true }));

    const result = await apiRequestPost('/path', { a: 1 }, 'https://api', 'token');

    expect(preformNetworkRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/path',
      basePath: 'https://api',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: { a: 1 },
      responseType: 'json',
    });
    expect(result).toEqual({ ok: true });
  });

  it('throws when the response has a non-success status', async () => {
    preformNetworkRequest.mockResolvedValue({ headers: {}, status: 500, statusText: 'Internal Server Error', data: 'boom' });

    await expect(apiRequestPost('/path', { a: 1 }, 'https://api')).rejects.toThrow();
  });
});

describe('apiRequestGet', () => {
  it('omits the Authorization header when no token is given', async () => {
    preformNetworkRequest.mockResolvedValue(okResponse(['x']));

    const result = await apiRequestGet('/path', 'https://api');

    expect(preformNetworkRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: '/path',
      basePath: 'https://api',
      headers: { 'Content-Type': 'application/json' },
      responseType: 'json',
    });
    expect(result).toEqual(['x']);
  });
});

describe('externalRequestGet', () => {
  it('gets the url without a base url', async () => {
    preformNetworkRequest.mockResolvedValue(okResponse({ id: 1 }));

    const result = await externalRequestGet('https://external/thing');

    expect(preformNetworkRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://external/thing',
      headers: { 'Content-Type': 'application/json' },
      responseType: 'json',
    });
    expect(result).toEqual({ id: 1 });
  });
});
