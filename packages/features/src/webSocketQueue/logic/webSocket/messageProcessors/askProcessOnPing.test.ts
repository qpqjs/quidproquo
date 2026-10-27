import { ContextActionType, runStory } from 'quidproquo-core';
import { WebsocketActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { WebSocketQueueClientMessageEventType, WebSocketQueueServerMessageEventType } from '../../../types';
import { askProcessOnPing, isWebSocketPingMessage } from './askProcessOnPing';

describe('isWebSocketPingMessage', () => {
  it('accepts a ping message', () => {
    expect(isWebSocketPingMessage({ type: WebSocketQueueClientMessageEventType.Ping } as any)).toBe(true);
  });

  it('rejects a non-ping message', () => {
    expect(isWebSocketPingMessage({ type: WebSocketQueueClientMessageEventType.Authenticate } as any)).toBe(false);
  });
});

describe('askProcessOnPing', () => {
  it('replies to the connection with a pong message', () => {
    let captured: any;

    runStory(askProcessOnPing('c1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [WebsocketActionType.SendMessage]: (action: any) => {
        captured = action;
        return undefined;
      },
    });

    expect(captured.payload.connectionId).toBe('c1');
    expect(captured.payload.payload).toEqual({ type: WebSocketQueueServerMessageEventType.Pong });
  });
});
