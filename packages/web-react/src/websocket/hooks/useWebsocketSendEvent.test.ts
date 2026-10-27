import { createElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { WebSocketContext } from '../WebsocketContext';
import { useWebsocketSendEvent } from './useWebsocketSendEvent';

const wrapperFor = (service: any) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(WebSocketContext.Provider, { value: service }, children);
  };

describe('useWebsocketSendEvent', () => {
  it('forwards the event to the websocket service', () => {
    const sendEvent = vi.fn();
    const { result } = renderHook(() => useWebsocketSendEvent(), { wrapper: wrapperFor({ sendEvent }) });

    const event = { type: 'thing' } as any;
    result.current(event);

    expect(sendEvent).toHaveBeenCalledWith(event);
  });

  it('does nothing when there is no service', () => {
    const { result } = renderHook(() => useWebsocketSendEvent());

    expect(() => result.current({ type: 'thing' } as any)).not.toThrow();
  });
});
