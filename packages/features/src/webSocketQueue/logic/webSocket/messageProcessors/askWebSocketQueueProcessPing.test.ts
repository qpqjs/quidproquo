import { ContextActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';
import { WebsocketActionType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { WebSocketQueueClientMessageEventType, WebSocketQueueServerMessageEventType } from '../../../types';
import { askWebSocketQueueProcessPing, isWebSocketPingMessage } from './askWebSocketQueueProcessPing';

describe('isWebSocketPingMessage', () => {
  it('accepts a ping message', () => {
    expect(isWebSocketPingMessage({ type: WebSocketQueueClientMessageEventType.Ping } as any)).toBe(true);
  });

  it('rejects a non-ping message', () => {
    expect(isWebSocketPingMessage({ type: WebSocketQueueClientMessageEventType.Authenticate } as any)).toBe(false);
  });
});

describe('askWebSocketQueueProcessPing', () => {
  it('replies to the connection with a pong message', () => {
    let captured: any;

    runStory(askWebSocketQueueProcessPing('c1'), {
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
