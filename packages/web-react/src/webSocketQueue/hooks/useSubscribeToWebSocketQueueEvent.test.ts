import { createElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { WebSocketContext } from '../../websocket/WebsocketContext';
import { useSubscribeToWebSocketQueueEvent } from './useSubscribeToWebSocketQueueEvent';

describe('useSubscribeToWebSocketQueueEvent', () => {
  it('subscribes to the queue event through the websocket service', () => {
    const subscribeToEvent = vi.fn().mockReturnValue({ type: 'handle' });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(WebSocketContext.Provider, { value: { subscribeToEvent, unsubscribe: vi.fn() } as any }, children);

    renderHook(() => useSubscribeToWebSocketQueueEvent('Qpq/WebSocketQueue/Thing' as any, vi.fn()), { wrapper });

    expect(subscribeToEvent).toHaveBeenCalledWith('Qpq/WebSocketQueue/Thing', expect.any(Function));
  });
});
