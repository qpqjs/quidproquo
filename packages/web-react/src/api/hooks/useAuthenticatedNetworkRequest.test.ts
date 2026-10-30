import { NetworkRequestActionPayload } from '@qpqjs/core';

import { createElement, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { authContext } from '../../auth/authContext';
import { AuthState } from '../../auth/types';
import { useAuthenticatedNetworkRequest } from './useAuthenticatedNetworkRequest';

// The real performNetworkRequest runs; only the fetch transport underneath it is stubbed.
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
});
afterEach(() => vi.unstubAllGlobals());

const sentHeaders = (): Record<string, string> => fetchMock.mock.calls.at(-1)![1].headers;

const wrapperFor = (state: AuthState) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(authContext.Provider, { value: state }, children);
  };

describe('useAuthenticatedNetworkRequest', () => {
  it('sends the request unchanged when there is no auth token', async () => {
    const payload = { url: 'https://api', method: 'GET' } as unknown as NetworkRequestActionPayload<any>;
    const { result } = renderHook(() => useAuthenticatedNetworkRequest(payload));

    await result.current();

    expect(fetchMock).toHaveBeenCalledWith('https://api/', expect.objectContaining({ method: 'GET' }));
    expect(sentHeaders()).toEqual({});
  });

  it('adds a bearer Authorization header when a token is present', async () => {
    const payload = { url: 'https://api', method: 'GET', headers: { 'X-A': '1' } } as unknown as NetworkRequestActionPayload<any>;
    const { result } = renderHook(() => useAuthenticatedNetworkRequest(payload), {
      wrapper: wrapperFor({ username: '', authenticationInfo: { accessToken: 'tok' } as any }),
    });

    await result.current();

    expect(sentHeaders()).toEqual({ 'X-A': '1', Authorization: 'Bearer tok' });
  });
});
