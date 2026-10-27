import { Action, runStory, throwsError } from 'quidproquo-core';
import { WebsocketActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { askSendMessage } from './askSendMessage';

describe('askSendMessage', () => {
  it('sends the payload to the admin api on the given connection', () => {
    let captured: Action<any> | undefined;

    runStory(askSendMessage('conn-1', { type: 'hello' } as any), {
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
      runStory(askSendMessage('conn-1', { type: 'hello' } as any), {
        [WebsocketActionType.SendMessage]: throwsError('Disconnected', 'gone'),
      }),
    ).not.toThrow();
  });
});
