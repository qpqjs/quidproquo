import { WebSocketQueueClientMessageEventType, WebSocketQueueServerMessageEventType } from 'quidproquo-features';

import { createElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { WebSocketContext } from '../../websocket/WebsocketContext';
import { WebSocketAuthContext } from '../../webSocketQueue/WebSocketAuthSync/WebSocketAuthContext';
import { useEventDocHeadMovedSubscription } from './useEventDocHeadMovedSubscription';

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
    fireEvent(type: string, payload?: unknown) {
      eventCallbacks.get(type)?.(this, { type, payload });
    },
  };
};

const renderWith = (service: any, isAuthenticated: boolean, docId: string | null, onHeadMoved = vi.fn()) => ({
  onHeadMoved,
  ...renderHook(({ currentDocId }) => useEventDocHeadMovedSubscription('envelopes', currentDocId, onHeadMoved), {
    initialProps: { currentDocId: docId },
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(
        WebSocketContext.Provider,
        { value: service },
        createElement(WebSocketAuthContext.Provider, { value: isAuthenticated }, children),
      ),
  }),
});

const sent = (service: any) => service.sendEvent.mock.calls.map((call: any[]) => [call[0].type, call[0].payload.topic]);

describe('useEventDocHeadMovedSubscription', () => {
  it('subscribes to the document topic once authenticated', () => {
    const service = buildService();
    renderWith(service, true, 'doc-1');

    expect(sent(service)).toEqual([[WebSocketQueueClientMessageEventType.Subscribe, 'eventDoc#envelopes#doc-1']]);
  });

  it('sends nothing while unauthenticated or without a document', () => {
    const unauthenticated = buildService();
    renderWith(unauthenticated, false, 'doc-1');
    const noDoc = buildService();
    renderWith(noDoc, true, null);

    expect(unauthenticated.sendEvent).not.toHaveBeenCalled();
    expect(noDoc.sendEvent).not.toHaveBeenCalled();
  });

  it('calls back for pushes about this document only', () => {
    const service = buildService();
    const { onHeadMoved } = renderWith(service, true, 'doc-1');

    const mine = { storeName: 'envelopes', type: 'envelope', docId: 'doc-1', headEventId: 4 };
    act(() => service.fireEvent(WebSocketQueueServerMessageEventType.EventDocHeadMoved, mine));
    act(() => service.fireEvent(WebSocketQueueServerMessageEventType.EventDocHeadMoved, { ...mine, docId: 'doc-2' }));
    act(() => service.fireEvent(WebSocketQueueServerMessageEventType.EventDocHeadMoved, { ...mine, storeName: 'templates' }));

    expect(onHeadMoved).toHaveBeenCalledTimes(1);
    expect(onHeadMoved).toHaveBeenCalledWith(mine);
  });

  it('subscribes again after the connection re-authenticates', () => {
    const service = buildService();
    renderWith(service, true, 'doc-1');
    service.sendEvent.mockClear();

    act(() => service.fireEvent(WebSocketQueueServerMessageEventType.Authenticated));

    expect(sent(service)).toEqual([[WebSocketQueueClientMessageEventType.Subscribe, 'eventDoc#envelopes#doc-1']]);
  });

  it('moves the subscription when the document changes', () => {
    const service = buildService();
    const { rerender } = renderWith(service, true, 'doc-1');
    service.sendEvent.mockClear();

    rerender({ currentDocId: 'doc-2' });

    expect(sent(service)).toEqual([
      [WebSocketQueueClientMessageEventType.Unsubscribe, 'eventDoc#envelopes#doc-1'],
      [WebSocketQueueClientMessageEventType.Subscribe, 'eventDoc#envelopes#doc-2'],
    ]);
  });

  it('unsubscribes on unmount while the socket is open, and stays quiet when it is closed', () => {
    const open = buildService();
    const mounted = renderWith(open, true, 'doc-1');
    open.sendEvent.mockClear();
    mounted.unmount();

    const closed = buildService(false);
    const mountedClosed = renderWith(closed, true, 'doc-1');
    closed.sendEvent.mockClear();
    mountedClosed.unmount();

    expect(sent(open)).toEqual([[WebSocketQueueClientMessageEventType.Unsubscribe, 'eventDoc#envelopes#doc-1']]);
    expect(closed.sendEvent).not.toHaveBeenCalled();
  });
});
