import { WebSocketQueueServerMessageEventType } from 'quidproquo-features';
import { WebsocketServiceEvent } from 'quidproquo-web';

import { createElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { WebSocketContext } from '../../websocket/WebsocketContext';
import { useWebsocketQueueSendEvent } from './useWebsocketQueueSendEvent';

const buildService = () => {
  let messageHandler: ((ws: any, event?: Event) => void) | undefined;
  return {
    sentEvents: [] as any[],
    subscribe: vi.fn((_type: WebsocketServiceEvent, cb: any) => {
      messageHandler = cb;
      return { type: _type };
    }),
    unsubscribe: vi.fn(),
    sendEvent: vi.fn(function (this: any, event: any) {
      this.sentEvents.push(event);
    }),
    deliver(data: unknown) {
      messageHandler?.(this, { data: JSON.stringify(data) } as MessageEvent);
    },
  };
};

const renderWith = (service: any, onCorrelated?: (event: any) => void) =>
  renderHook(() => useWebsocketQueueSendEvent(onCorrelated), {
    wrapper: ({ children }: { children: ReactNode }) => createElement(WebSocketContext.Provider, { value: service }, children),
  });

describe('useWebsocketQueueSendEvent', () => {
  it('resolves a service request when the correlated response arrives', async () => {
    const service = buildService();
    const { result } = renderWith(service);

    let pending: Promise<any>;
    act(() => {
      pending = result.current({ type: 'qpq/serviceRequest/svc/method', payload: { a: 1 } } as any);
    });

    const { correlationId, type } = service.sentEvents[0];
    expect(type).toBe('qpq/serviceRequest/svc/method');

    act(() => {
      service.deliver({ correlationId, type: WebSocketQueueServerMessageEventType.ServiceRequestResponse, payload: { ok: true } });
    });

    await expect(pending!).resolves.toEqual({ ok: true });
  });

  it('routes non-response correlated messages to the onCorrelatedMessage callback', () => {
    const service = buildService();
    const onCorrelated = vi.fn();
    const { result } = renderWith(service, onCorrelated);

    act(() => {
      result.current({ type: 'qpq/other', payload: {} } as any);
    });

    const { correlationId } = service.sentEvents[0];
    act(() => {
      service.deliver({ correlationId, type: WebSocketQueueServerMessageEventType.StateDispatch, payload: { x: 1 } });
    });

    expect(onCorrelated).toHaveBeenCalledWith({ correlationId, type: WebSocketQueueServerMessageEventType.StateDispatch, payload: { x: 1 } });
  });

  it('keeps delivering correlated messages that arrive AFTER the response', () => {
    // The correlation is a subscription for the life of the component, not a one-shot for the
    // request. A handler that responds first and then streams (a batch reporting progress per
    // record) depends on this: retiring the correlation on response silently dropped
    // everything that followed.
    const service = buildService();
    const onCorrelated = vi.fn();
    const { result } = renderWith(service, onCorrelated);

    act(() => {
      result.current({ type: 'qpq/serviceRequest/svc/method', payload: {} } as any);
    });
    const { correlationId } = service.sentEvents[0];

    act(() => {
      service.deliver({ correlationId, type: WebSocketQueueServerMessageEventType.ServiceRequestResponse, payload: { ok: true } });
    });
    act(() => {
      service.deliver({ correlationId, type: WebSocketQueueServerMessageEventType.StateDispatch, payload: { row: 1 } });
    });

    expect(onCorrelated).toHaveBeenCalledWith({
      correlationId,
      type: WebSocketQueueServerMessageEventType.StateDispatch,
      payload: { row: 1 },
    });
  });

  it('ignores messages with unknown correlation ids', () => {
    const service = buildService();
    const onCorrelated = vi.fn();
    renderWith(service, onCorrelated);

    act(() => {
      service.deliver({ correlationId: 'unknown', type: WebSocketQueueServerMessageEventType.StateDispatch });
    });

    expect(onCorrelated).not.toHaveBeenCalled();
  });

  it('resolves undefined and sends nothing when there is no service', async () => {
    const { result } = renderHook(() => useWebsocketQueueSendEvent());

    await expect(result.current({ type: 'qpq/serviceRequest/svc/m', payload: {} } as any)).resolves.toBeUndefined();
  });
});
