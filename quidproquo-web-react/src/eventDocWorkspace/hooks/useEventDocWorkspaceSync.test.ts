import { EventDocWorkspaceState, WebSocketQueueClientMessageEventType, WebSocketQueueServerMessageEventType } from 'quidproquo-features';

import { createElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { WebSocketContext } from '../../websocket/WebsocketContext';
import { WebSocketAuthContext } from '../../webSocketQueue/WebSocketAuthSync/WebSocketAuthContext';
import { useEventDocWorkspaceSync } from './useEventDocWorkspaceSync';

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

const buildState = (slots: Record<string, { id: string; isLoading?: boolean }>): EventDocWorkspaceState =>
  ({
    slots: Object.fromEntries(
      Object.entries(slots).map(([slotKey, { id, isLoading = false }]) => [
        slotKey,
        { documentIdentity: { serviceName: 'sign', basePath: '/envelopes', id }, isLoading, isSaving: false, error: null },
      ]),
    ),
  }) as unknown as EventDocWorkspaceState;

const storeNames = { envelope: 'envelopes' };

const buildApi = () => ({ syncHeadMoved: vi.fn().mockResolvedValue(undefined), refresh: vi.fn().mockResolvedValue(undefined) });

const renderWith = (service: any, isAuthenticated: boolean, state: EventDocWorkspaceState, api = buildApi()) => ({
  api,
  ...renderHook(({ currentState }) => useEventDocWorkspaceSync(storeNames, currentState, api), {
    initialProps: { currentState: state },
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(
        WebSocketContext.Provider,
        { value: service },
        createElement(WebSocketAuthContext.Provider, { value: isAuthenticated }, children),
      ),
  }),
});

const sentTypes = (service: any) => service.sendEvent.mock.calls.map((call: any[]) => [call[0].type, call[0].payload.topic]);

describe('useEventDocWorkspaceSync', () => {
  it('subscribes each bound document slot to its head-moved topic once authenticated', () => {
    const service = buildService();
    renderWith(service, true, buildState({ envelope: { id: 'doc-1' } }));

    expect(sentTypes(service)).toEqual([[WebSocketQueueClientMessageEventType.Subscribe, 'eventDoc#envelopes#doc-1']]);
  });

  it('sends nothing while the connection is not authenticated', () => {
    const service = buildService();
    renderWith(service, false, buildState({ envelope: { id: 'doc-1' } }));

    expect(service.sendEvent).not.toHaveBeenCalled();
  });

  it('routes a head-moved push for a bound document to its slot and ignores other documents', () => {
    const service = buildService();
    const { api } = renderWith(service, true, buildState({ envelope: { id: 'doc-1' } }));

    act(() =>
      service.fireEvent(WebSocketQueueServerMessageEventType.EventDocHeadMoved, {
        storeName: 'envelopes',
        type: 'envelope',
        docId: 'doc-1',
        headEventId: 7,
        clientMessageId: 'cm-7',
      }),
    );
    act(() =>
      service.fireEvent(WebSocketQueueServerMessageEventType.EventDocHeadMoved, {
        storeName: 'envelopes',
        type: 'envelope',
        docId: 'doc-2',
        headEventId: 3,
      }),
    );

    expect(api.syncHeadMoved).toHaveBeenCalledTimes(1);
    expect(api.syncHeadMoved).toHaveBeenCalledWith('envelope', 7, 'cm-7');
  });

  it('subscribes again and tail-pulls after the connection re-authenticates', () => {
    const service = buildService();
    const { api } = renderWith(service, true, buildState({ envelope: { id: 'doc-1' } }));
    service.sendEvent.mockClear();

    act(() => service.fireEvent(WebSocketQueueServerMessageEventType.Authenticated));

    expect(sentTypes(service)).toEqual([[WebSocketQueueClientMessageEventType.Subscribe, 'eventDoc#envelopes#doc-1']]);
    expect(api.refresh).toHaveBeenCalledWith('envelope');
  });

  it('does not tail-pull a slot whose bootstrap is still loading', () => {
    const service = buildService();
    const { api } = renderWith(service, true, buildState({ envelope: { id: 'doc-1', isLoading: true } }));

    act(() => service.fireEvent(WebSocketQueueServerMessageEventType.Authenticated));

    expect(api.refresh).not.toHaveBeenCalled();
  });

  it('moves the subscription when the slot is bound to another document', () => {
    const service = buildService();
    const { rerender } = renderWith(service, true, buildState({ envelope: { id: 'doc-1' } }));
    service.sendEvent.mockClear();

    rerender({ currentState: buildState({ envelope: { id: 'doc-2' } }) });

    expect(sentTypes(service)).toEqual([
      [WebSocketQueueClientMessageEventType.Unsubscribe, 'eventDoc#envelopes#doc-1'],
      [WebSocketQueueClientMessageEventType.Subscribe, 'eventDoc#envelopes#doc-2'],
    ]);
  });

  it('unsubscribes on unmount while the socket is open', () => {
    const service = buildService();
    const { unmount } = renderWith(service, true, buildState({ envelope: { id: 'doc-1' } }));
    service.sendEvent.mockClear();

    unmount();

    expect(sentTypes(service)).toEqual([[WebSocketQueueClientMessageEventType.Unsubscribe, 'eventDoc#envelopes#doc-1']]);
  });

  it('sends no unsubscribe on unmount while the socket is closed', () => {
    const service = buildService(false);
    const { unmount } = renderWith(service, true, buildState({ envelope: { id: 'doc-1' } }));
    service.sendEvent.mockClear();

    unmount();

    expect(service.sendEvent).not.toHaveBeenCalled();
  });
});
