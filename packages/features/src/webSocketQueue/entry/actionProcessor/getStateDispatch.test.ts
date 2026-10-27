import { ContextActionType, runStory, StateActionType } from 'quidproquo-core';
import { WebsocketActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

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

describe('getStateDispatch', () => {
  it('maps the state dispatch action to a custom processor', () => {
    const processors = getStateDispatch([]);

    expect(typeof processors[StateActionType.Dispatch]).toBe('function');
  });
});
