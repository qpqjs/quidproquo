import { createElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { WebSocketContext } from '../WebsocketContext';
import { useWebsocketApi } from './useWebsocketApi';

describe('useWebsocketApi', () => {
  it('returns null without a provider', () => {
    const { result } = renderHook(() => useWebsocketApi());

    expect(result.current).toBeNull();
  });

  it('returns the service from the provider', () => {
    const service = { id: 'svc' } as any;
    const wrapper = ({ children }: { children: ReactNode }) => createElement(WebSocketContext.Provider, { value: service }, children);

    const { result } = renderHook(() => useWebsocketApi(), { wrapper });

    expect(result.current).toBe(service);
  });
});
