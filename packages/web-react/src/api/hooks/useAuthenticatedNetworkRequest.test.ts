import { createElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { authContext } from '../../auth/authContext';
import { AuthState } from '../../auth/types';

const { preformNetworkRequest } = vi.hoisted(() => ({ preformNetworkRequest: vi.fn().mockResolvedValue({ status: 200 }) }));

vi.mock('quidproquo-webserver', async (importOriginal: <T>() => Promise<T>) => {
  const original = await importOriginal<typeof import('quidproquo-webserver')>();
  return { ...original, preformNetworkRequest };
});

import { useAuthenticatedNetworkRequest } from './useAuthenticatedNetworkRequest';

const wrapperFor = (state: AuthState) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(authContext.Provider, { value: state }, children);
  };

describe('useAuthenticatedNetworkRequest', () => {
  it('sends the request unchanged when there is no auth token', async () => {
    const payload = { url: 'https://api', verb: 'GET' } as any;
    const { result } = renderHook(() => useAuthenticatedNetworkRequest(payload));

    await result.current();

    expect(preformNetworkRequest).toHaveBeenLastCalledWith(payload);
  });

  it('adds a bearer Authorization header when a token is present', async () => {
    const payload = { url: 'https://api', verb: 'GET', headers: { 'X-A': '1' } } as any;
    const { result } = renderHook(() => useAuthenticatedNetworkRequest(payload), {
      wrapper: wrapperFor({ username: '', password: '', authenticationInfo: { accessToken: 'tok' } as any }),
    });

    await result.current();

    expect(preformNetworkRequest).toHaveBeenLastCalledWith({
      url: 'https://api',
      verb: 'GET',
      headers: { 'X-A': '1', Authorization: 'Bearer tok' },
    });
  });
});
