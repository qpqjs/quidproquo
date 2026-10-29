import { ActionProcessorListResolver } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';
import { ApiActionType } from '@qpqjs/webserver';

import { createElement, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { authContext } from '../../auth/authContext';
import { AuthState } from '../../auth/types';
import { BaseUrlContext } from '../../baseUrl/BaseUrlContext';
import { BaseUrlResolvers } from '../../baseUrl/types';
import { useApiRequestActionProcessor } from './useApiRequestActionProcessor';

// The hook builds a real api request processor; the only stub is the fetch transport under it, so
// each test sends one request through the processor and reads what reached the wire.
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
});
afterEach(() => vi.unstubAllGlobals());

const requestThrough = async (resolver: ActionProcessorListResolver): Promise<{ url: string; headers: Record<string, string> }> => {
  const processors = await resolver(buildTestQpqConfig(), noopDynamicModuleLoader);
  await invokeProcessor(processors[ApiActionType.Request]!, { service: 'svc', endpoint: '/items', method: 'GET' });

  const [url, init] = fetchMock.mock.calls.at(-1)!;
  return { url, headers: init.headers };
};

const resolvers: BaseUrlResolvers = {
  getApiUrl: () => 'https://api',
  getWsUrl: () => 'wss://ws',
  getMFManifestUrl: () => 'https://mf',
};

const wrapperFor = (state: AuthState) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(BaseUrlContext.Provider, { value: resolvers }, createElement(authContext.Provider, { value: state }, children));
  };

const signedOut: AuthState = { username: '' };
const signedIn: AuthState = { username: '', authenticationInfo: { accessToken: 'tok' } as any };

describe('useApiRequestActionProcessor', () => {
  it('sends no authorization header when there is no token', async () => {
    const { result } = renderHook(() => useApiRequestActionProcessor(), { wrapper: wrapperFor(signedOut) });

    const { headers } = await requestThrough(result.current);

    expect(headers).toEqual({});
  });

  it('sends a bearer header built from the current access token', async () => {
    const { result } = renderHook(() => useApiRequestActionProcessor(), { wrapper: wrapperFor(signedIn) });

    const { headers } = await requestThrough(result.current);

    expect(headers).toEqual({ Authorization: 'Bearer tok' });
  });

  // Security regression: app-supplied extra headers (tenant id, tracing) merge under the auth header, so a
  // stray or forged Authorization among them can never replace the signed-in user's bearer token.
  it('keeps the real bearer token over an Authorization supplied through extra headers', async () => {
    const getExtraHeaders = () => ({ 'x-qpq-tenant-id': 'tenant-1', Authorization: 'Bearer forged' });
    const { result } = renderHook(() => useApiRequestActionProcessor({ getExtraHeaders }), { wrapper: wrapperFor(signedIn) });

    const { headers } = await requestThrough(result.current);

    expect(headers).toEqual({ 'x-qpq-tenant-id': 'tenant-1', Authorization: 'Bearer tok' });
  });

  it('defaults the service base url to the api url resolver', async () => {
    const { result } = renderHook(() => useApiRequestActionProcessor(), { wrapper: wrapperFor(signedOut) });

    const { url } = await requestThrough(result.current);

    expect(url).toBe('https://api/items');
  });

  it('honors a custom resolveServiceBaseUrl option', async () => {
    const resolveServiceBaseUrl = (service: string) => `https://${service}`;
    const { result } = renderHook(() => useApiRequestActionProcessor({ resolveServiceBaseUrl }), { wrapper: wrapperFor(signedOut) });

    const { url } = await requestThrough(result.current);

    expect(url).toBe('https://svc/items');
  });
});
