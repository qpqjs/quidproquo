import { WebsocketServiceEvent } from 'quidproquo-web';

import { createElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { WebSocketContext } from '../WebsocketContext';
import { useSubscribeToWebsocket } from './useSubscribeToWebsocket';

const wrapperFor = (service: any) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(WebSocketContext.Provider, { value: service }, children);
  };

describe('useSubscribeToWebsocket', () => {
  it('subscribes to the given event on mount', () => {
    const subscribe = vi.fn().mockReturnValue({ type: WebsocketServiceEvent.OPEN });
    const callback = vi.fn();

    renderHook(() => useSubscribeToWebsocket(WebsocketServiceEvent.OPEN, callback), {
      wrapper: wrapperFor({ subscribe, unsubscribe: vi.fn() }),
    });

    expect(subscribe).toHaveBeenCalledWith(WebsocketServiceEvent.OPEN, expect.any(Function));
  });

  it('unsubscribes on unmount', () => {
    const handle = { type: WebsocketServiceEvent.OPEN };
    const subscribe = vi.fn().mockReturnValue(handle);
    const unsubscribe = vi.fn();

    const { unmount } = renderHook(() => useSubscribeToWebsocket(WebsocketServiceEvent.OPEN, vi.fn()), {
      wrapper: wrapperFor({ subscribe, unsubscribe }),
    });

    unmount();

    expect(unsubscribe).toHaveBeenCalledWith(handle);
  });

  it('does not throw without a service', () => {
    expect(() => renderHook(() => useSubscribeToWebsocket(WebsocketServiceEvent.OPEN, vi.fn()))).not.toThrow();
  });
});
