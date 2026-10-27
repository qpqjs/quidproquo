import { askWebsocketSendMessageBase, captureRequester, createActionProcessor, ProcessorFor } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askWebsocketSendMessage, askWebsocketSendMessageBase } from './askWebsocketSendMessage';
import { WebsocketActionType } from './WebsocketActionType';

describe('askWebsocketSendMessage', () => {
  it('yields a SendMessage action with the api name, connection id and payload', () => {
    const { action } = captureRequester(askWebsocketSendMessage('api', 'conn-1', { hello: 'world' }));

    expect(action).toEqual({
      type: WebsocketActionType.SendMessage,
      payload: { websocketApiName: 'api', connectionId: 'conn-1', payload: { hello: 'world' } },
    });
  });
});

describe('askWebsocketSendMessageBase.errorType', () => {
  it('namespaces each error name under the SendMessage action type', () => {
    expect(askWebsocketSendMessageBase.errorType.Throttled).toBe(`${WebsocketActionType.SendMessage}-Throttled`);
    expect(askWebsocketSendMessageBase.errorType.Disconnected).toBe(`${WebsocketActionType.SendMessage}-Disconnected`);
  });
});
