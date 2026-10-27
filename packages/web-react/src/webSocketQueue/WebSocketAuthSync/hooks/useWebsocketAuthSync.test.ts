import { WebSocketQueueClientMessageEventType, WebSocketQueueServerMessageEventType } from 'quidproquo-features';
import { WebsocketServiceEvent } from 'quidproquo-web';

import { createElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { WebSocketContext } from '../../../websocket/WebsocketContext';
import { useWebsocketAuthSync } from './useWebsocketAuthSync';

const buildService = (isConnected = true) => {
  const eventCallbacks = new Map<string, (svc: any, event: any) => void>();
  return {
    sendEvent: vi.fn(),
    isConnected: () => isConnected,
    subscribe: vi.fn(() => ({ type: 'h' })),
    unsubscribe: vi.fn(),
    subscribeToEvent: vi.fn((type: string, cb: any) => {
      eventCallbacks.set(type, cb);
      return { type };
    }),
    fireEvent(type: string) {
      eventCallbacks.get(type)?.(this, { type });
    },
  };
};

const renderWith = (service: any, accessToken?: string) =>
  renderHook(({ token }) => useWebsocketAuthSync(token), {
    initialProps: { token: accessToken },
    wrapper: ({ children }: { children: ReactNode }) => createElement(WebSocketContext.Provider, { value: service }, children),
  });

describe('useWebsocketAuthSync', () => {
  it('sends an authenticate message when a token is present and connected', () => {
    const service = buildService(true);
    renderWith(service, 'tok');

    expect(service.sendEvent).toHaveBeenCalledWith({
      type: WebSocketQueueClientMessageEventType.Authenticate,
      payload: { accessToken: 'tok' },
    });
  });

  it('does not send when the socket is not connected', () => {
    const service = buildService(false);
    renderWith(service, 'tok');

    expect(service.sendEvent).not.toHaveBeenCalled();
  });

  it('reflects the authenticated state from server events', () => {
    const service = buildService(true);
    const { result } = renderWith(service, 'tok');

    expect(result.current).toBe(false);

    act(() => service.fireEvent(WebSocketQueueServerMessageEventType.Authenticated));
    expect(result.current).toBe(true);

    act(() => service.fireEvent(WebSocketQueueServerMessageEventType.Unauthenticated));
    expect(result.current).toBe(false);
  });

  it('subscribes to the open and close lifecycle events', () => {
    const service = buildService(true);
    renderWith(service, 'tok');

    const subscribedTypes = service.subscribe.mock.calls.map((call: any[]) => call[0]);
    expect(subscribedTypes).toContain(WebsocketServiceEvent.OPEN);
    expect(subscribedTypes).toContain(WebsocketServiceEvent.CLOSE);
  });

  it('sends an unauthenticate message once authenticated and the token is cleared', () => {
    const service = buildService(true);
    const { result, rerender } = renderWith(service, 'tok');

    act(() => service.fireEvent(WebSocketQueueServerMessageEventType.Authenticated));
    expect(result.current).toBe(true);

    service.sendEvent.mockClear();
    rerender({ token: undefined });

    expect(service.sendEvent).toHaveBeenCalledWith({ type: WebSocketQueueClientMessageEventType.Unauthenticate });
  });
});
