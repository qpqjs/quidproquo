import { createElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { authContext } from '../../auth/authContext';
import { AuthState } from '../../auth/types';
import { BaseUrlContext } from '../../baseUrl/BaseUrlContext';
import { BaseUrlResolvers } from '../../baseUrl/types';

const { createApiRequestActionProcessor } = vi.hoisted(() => ({ createApiRequestActionProcessor: vi.fn().mockReturnValue(async () => ({})) }));

vi.mock('@qpqjs/actionprocessor-web', async (importOriginal: <T>() => Promise<T>) => {
  const original = await importOriginal<typeof import('@qpqjs/actionprocessor-web')>();
  return { ...original, createApiRequestActionProcessor };
});

import { useApiRequestActionProcessor } from './useApiRequestActionProcessor';

const resolvers: BaseUrlResolvers = {
  getApiUrl: () => 'https://api',
  getWsUrl: () => 'wss://ws',
  getMFManifestUrl: () => 'https://mf',
};

const wrapperFor = (state: AuthState) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(BaseUrlContext.Provider, { value: resolvers }, createElement(authContext.Provider, { value: state }, children));
  };

describe('useApiRequestActionProcessor', () => {
  it('builds headers without authorization when there is no token', () => {
    renderHook(() => useApiRequestActionProcessor(), { wrapper: wrapperFor({ username: '', password: '' }) });

    const { getHeaders } = createApiRequestActionProcessor.mock.calls.at(-1)![0];
    expect(getHeaders()).toEqual({});
  });

  it('builds a bearer header from the current access token', () => {
    renderHook(() => useApiRequestActionProcessor(), {
      wrapper: wrapperFor({ username: '', password: '', authenticationInfo: { accessToken: 'tok' } as any }),
    });

    const { getHeaders } = createApiRequestActionProcessor.mock.calls.at(-1)![0];
    expect(getHeaders()).toEqual({ Authorization: 'Bearer tok' });
  });

  // Security regression: app-supplied extra headers (tenant id, tracing) merge under the auth header, so a
  // stray or forged Authorization among them can never replace the signed-in user's bearer token.
  it('keeps the real bearer token over an Authorization supplied through extra headers', () => {
    const getExtraHeaders = () => ({ 'x-qpq-tenant-id': 'tenant-1', Authorization: 'Bearer forged' });
    renderHook(() => useApiRequestActionProcessor({ getExtraHeaders }), {
      wrapper: wrapperFor({ username: '', password: '', authenticationInfo: { accessToken: 'tok' } as any }),
    });

    const { getHeaders } = createApiRequestActionProcessor.mock.calls.at(-1)![0];
    expect(getHeaders()).toEqual({ 'x-qpq-tenant-id': 'tenant-1', Authorization: 'Bearer tok' });
  });

  it('defaults the service base url to the api url resolver', () => {
    renderHook(() => useApiRequestActionProcessor(), { wrapper: wrapperFor({ username: '', password: '' }) });

    const { resolveServiceBaseUrl } = createApiRequestActionProcessor.mock.calls.at(-1)![0];
    expect(resolveServiceBaseUrl('svc')).toBe('https://api');
  });

  it('honors a custom resolveServiceBaseUrl option', () => {
    const resolveServiceBaseUrl = (service: string) => `https://${service}`;
    renderHook(() => useApiRequestActionProcessor({ resolveServiceBaseUrl }), { wrapper: wrapperFor({ username: '', password: '' }) });

    const options = createApiRequestActionProcessor.mock.calls.at(-1)![0];
    expect(options.resolveServiceBaseUrl('svc')).toBe('https://svc');
  });
});
