import { WebSocketQueueClientMessageEventType } from 'quidproquo-features';

import { createElement, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { WebSocketContext } from '../../../websocket/WebsocketContext';
import { useWebsocketPingPong } from './useWebsocketPingPong';

describe('useWebsocketPingPong', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('sends a ping on mount and again on each interval', () => {
    const sendEvent = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => createElement(WebSocketContext.Provider, { value: { sendEvent } as any }, children);

    renderHook(() => useWebsocketPingPong(), { wrapper });

    expect(sendEvent).toHaveBeenCalledTimes(1);
    expect(sendEvent).toHaveBeenCalledWith({ type: WebSocketQueueClientMessageEventType.Ping });

    act(() => vi.advanceTimersByTime(8 * 60 * 1000));

    expect(sendEvent).toHaveBeenCalledTimes(2);
  });
});
