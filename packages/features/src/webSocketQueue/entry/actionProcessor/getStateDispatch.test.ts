import { ContextActionType, runStory, StateActionType } from '@qpqjs/core';
import { WebsocketActionType } from '@qpqjs/webserver';

import { describe, expect, it, vi } from 'vitest';

import { WebSocketQueueServerMessageEventType } from '../../types/serverMessages';
import { askStateDispatchToFrontend, getStateDispatch } from './getStateDispatch';

describe('askStateDispatchToFrontend', () => {
  it('sends a state dispatch message with the correlation id to the connection', () => {
    let captured: any;

    runStory(askStateDispatchToFrontend({ action: { type: 'increment' } } as any), {
      [ContextActionType.Read]: { connectionId: 'c1', correlationId: 'corr', apiName: 'demo' },
      [WebsocketActionType.SendMessage]: (action: any) => {
        captured = action;
        return undefined;
      },
    });

    expect(captured.payload.connectionId).toBe('c1');
    expect(captured.payload.payload).toEqual({
      type: WebSocketQueueServerMessageEventType.StateDispatch,
      payload: { type: 'increment' },
      correlationId: 'corr',
    });
  });
});

// Security regression: a story with no websocket connection in its context (a queue or schedule run, say) cannot push
// state to anyone; the dispatch fails before any message is sent.
describe('askStateDispatchToFrontend without a websocket context', () => {
  it('throws and sends nothing when no connection info was provided', () => {
    const send = vi.fn();

    expect(() =>
      runStory(askStateDispatchToFrontend({ action: { type: 'increment' } } as any), {
        [ContextActionType.Read]: {},
        [WebsocketActionType.SendMessage]: send,
      }),
    ).toThrowError();
    expect(send).not.toHaveBeenCalled();
  });
});

describe('getStateDispatch', () => {
  it('maps the state dispatch action to a custom processor', () => {
    const processors = getStateDispatch([]);

    expect(typeof processors[StateActionType.Dispatch]).toBe('function');
  });
});
