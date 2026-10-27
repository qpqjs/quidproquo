import { createElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { authContext } from '../authContext';
import { AuthState } from '../types';
import { useAuthAccessToken } from './useAuthAccessToken';

const wrapperFor = (state: AuthState) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(authContext.Provider, { value: state }, children);
  };

describe('useAuthAccessToken', () => {
  it('returns undefined when there is no authentication info', () => {
    const { result } = renderHook(() => useAuthAccessToken());

    expect(result.current).toBeUndefined();
  });

  it('returns the access token from the auth context', () => {
    const { result } = renderHook(() => useAuthAccessToken(), {
      wrapper: wrapperFor({ username: '', password: '', authenticationInfo: { accessToken: 'token-123' } as any }),
    });

    expect(result.current).toBe('token-123');
  });
});
