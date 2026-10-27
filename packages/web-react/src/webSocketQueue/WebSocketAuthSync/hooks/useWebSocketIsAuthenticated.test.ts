import { createElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { WebSocketAuthContext } from '../WebSocketAuthContext';
import { useWebSocketIsAuthenticated } from './useWebSocketIsAuthenticated';

describe('useWebSocketIsAuthenticated', () => {
  it('defaults to false', () => {
    const { result } = renderHook(() => useWebSocketIsAuthenticated());

    expect(result.current).toBe(false);
  });

  it('reflects the provider value', () => {
    const wrapper = ({ children }: { children: ReactNode }) => createElement(WebSocketAuthContext.Provider, { value: true }, children);

    const { result } = renderHook(() => useWebSocketIsAuthenticated(), { wrapper });

    expect(result.current).toBe(true);
  });
});
