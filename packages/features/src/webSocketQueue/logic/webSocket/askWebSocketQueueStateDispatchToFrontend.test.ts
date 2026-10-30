import { ContextActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';
import { WebsocketActionType } from '@qpqjs/webserver';

import { describe, expect, it, vi } from 'vitest';

import { WebSocketQueueServerMessageEventType } from '../../types/serverMessages';
import { askWebSocketQueueStateDispatchToFrontend } from './askWebSocketQueueStateDispatchToFrontend';

describe('askWebSocketQueueStateDispatchToFrontend', () => {
  it('sends a state dispatch message with the correlation id to the connection', () => {
    let captured: any;

    runStory(askWebSocketQueueStateDispatchToFrontend({ action: { type: 'increment' } } as any), {
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
describe('askWebSocketQueueStateDispatchToFrontend without a websocket context', () => {
  it('throws and sends nothing when no connection info was provided', () => {
    const send = vi.fn();

    expect(() =>
      runStory(askWebSocketQueueStateDispatchToFrontend({ action: { type: 'increment' } } as any), {
        [ContextActionType.Read]: {},
        [WebsocketActionType.SendMessage]: send,
      }),
    ).toThrowError();
    expect(send).not.toHaveBeenCalled();
  });
});
