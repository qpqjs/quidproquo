import { AskResponse, askStateRead } from 'quidproquo-core';
import { WebSocketQueueServerMessageEventType } from 'quidproquo-features';
import { WebsocketService } from 'quidproquo-web';

import { createElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import { createQpqRuntimeDefinition } from '../../runtime/createQpqRuntimeDefinition';
import { QpqStoreProvider } from '../../store/QpqStoreProvider';
import { WebSocketContext } from '../../websocket/WebsocketContext';
import { useQpqWebsocketQueueRuntime } from './useQpqWebsocketQueueRuntime';

type State = { value: number };

const reducer = (state: State, action: { type: 'set'; value: number }): [State, boolean] =>
  action.type === 'set' ? [{ value: action.value }, true] : [state, false];

function* askReadValue(): AskResponse<State> {
  return yield* askStateRead<State>();
}

const api = { askReadValue };

const buildRuntime = (uniqueName: string) =>
  createQpqRuntimeDefinition<State, { type: 'set'; value: number }, typeof api>({
    uniqueName,
    api,
    initialState: { value: 0 },
    reducer,
  });

const buildService = () => {
  let messageHandler: ((ws: any, event?: Event) => void) | undefined;
  return {
    sentEvents: [] as any[],
    subscribe: vi.fn((_type: any, cb: any) => {
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

const buildWrapper = (service: ReturnType<typeof buildService>) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QpqStoreProvider,
      null,
      createElement(WebSocketContext.Provider, { value: service as unknown as WebsocketService }, children),
    );
  };

describe('useQpqWebsocketQueueRuntime', () => {
  it('returns the runtime tuple with a queue sendEvent', async () => {
    const service = buildService();
    const runtime = buildRuntime('queue');

    const { result } = renderHook(() => useQpqWebsocketQueueRuntime(runtime), { wrapper: buildWrapper(service) });

    const [mappedApi, , , sendEvent] = result.current;
    expect(typeof (mappedApi as any).readValue).toBe('function');
    expect(typeof sendEvent).toBe('function');
  });

  it('dispatches state-dispatch queue messages into the runtime', async () => {
    const service = buildService();
    const runtime = buildRuntime('queue-dispatch');

    const { result } = renderHook(() => useQpqWebsocketQueueRuntime(runtime), { wrapper: buildWrapper(service) });

    act(() => {
      result.current[3]({ type: 'qpq/other', payload: {} } as any);
    });
    const { correlationId } = service.sentEvents[0];

    act(() => {
      service.deliver({ correlationId, type: WebSocketQueueServerMessageEventType.StateDispatch, payload: { type: 'set', value: 7 } });
    });

    await waitFor(() => expect(result.current[1]).toEqual({ value: 7 }));
  });
});
