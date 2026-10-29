import { Action } from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';
import { WebsocketActionType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { askAdminWebSocketSendMessage } from './askAdminWebSocketSendMessage';

describe('askAdminWebSocketSendMessage', () => {
  it('sends the payload to the admin api on the given connection', () => {
    let captured: Action<any> | undefined;

    runStory(askAdminWebSocketSendMessage('conn-1', { type: 'hello' } as any), {
      [WebsocketActionType.SendMessage]: (action: Action<any>) => {
        captured = action;
      },
    });

    expect(captured?.payload).toEqual({
      websocketApiName: 'qpqadmin',
      connectionId: 'conn-1',
      payload: { type: 'hello' },
    });
  });

  it('swallows send failures via askCatch', () => {
    expect(() =>
      runStory(askAdminWebSocketSendMessage('conn-1', { type: 'hello' } as any), {
        [WebsocketActionType.SendMessage]: throwsError('Disconnected', 'gone'),
      }),
    ).not.toThrow();
  });
});
