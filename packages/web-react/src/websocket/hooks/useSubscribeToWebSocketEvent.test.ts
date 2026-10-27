import { createElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { WebSocketContext } from '../WebsocketContext';
import { useSubscribeToWebSocketEvent } from './useSubscribeToWebSocketEvent';

const wrapperFor = (service: any) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(WebSocketContext.Provider, { value: service }, children);
  };

describe('useSubscribeToWebSocketEvent', () => {
  it('subscribes to the typed event on mount', () => {
    const subscribeToEvent = vi.fn().mockReturnValue({ type: 'handle' });

    renderHook(() => useSubscribeToWebSocketEvent('my/event', vi.fn()), {
      wrapper: wrapperFor({ subscribeToEvent, unsubscribe: vi.fn() }),
    });

    expect(subscribeToEvent).toHaveBeenCalledWith('my/event', expect.any(Function));
  });

  it('unsubscribes on unmount', () => {
    const handle = { type: 'handle' };
    const unsubscribe = vi.fn();

    const { unmount } = renderHook(() => useSubscribeToWebSocketEvent('my/event', vi.fn()), {
      wrapper: wrapperFor({ subscribeToEvent: vi.fn().mockReturnValue(handle), unsubscribe }),
    });

    unmount();

    expect(unsubscribe).toHaveBeenCalledWith(handle);
  });
});
