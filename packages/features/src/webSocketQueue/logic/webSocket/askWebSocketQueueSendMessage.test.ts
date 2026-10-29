import { ContextActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';
import { WebsocketActionType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { askWebSocketQueueSendMessage } from './askWebSocketQueueSendMessage';

describe('askWebSocketQueueSendMessage', () => {
  it('sends the payload over the websocket using the connection-info api name', () => {
    let captured: any;

    runStory(askWebSocketQueueSendMessage('c1', { type: 'anything' } as any), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [WebsocketActionType.SendMessage]: (action: any) => {
        captured = action;
        return undefined;
      },
    });

    expect(captured.payload).toEqual({
      websocketApiName: 'demo',
      connectionId: 'c1',
      payload: { type: 'anything' },
    });
  });
});
