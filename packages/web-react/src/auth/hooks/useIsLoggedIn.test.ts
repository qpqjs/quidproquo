import { createElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { authContext } from '../authContext';
import { AuthState } from '../types';
import { useIsLoggedIn } from './useIsLoggedIn';

const wrapperFor = (state: AuthState) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(authContext.Provider, { value: state }, children);
  };

describe('useIsLoggedIn', () => {
  it('is false without an access token', () => {
    const { result } = renderHook(() => useIsLoggedIn());

    expect(result.current).toBe(false);
  });

  it('is true when an access token is present', () => {
    const { result } = renderHook(() => useIsLoggedIn(), {
      wrapper: wrapperFor({ username: '', password: '', authenticationInfo: { accessToken: 'abc' } as any }),
    });

    expect(result.current).toBe(true);
  });
});
