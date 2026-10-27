import { ContextActionType, KeyValueStoreActionType, runStory } from 'quidproquo-core';
import { WebsocketActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { WebSocketQueueClientMessageEventType, WebSocketQueueServerMessageEventType } from '../../../types';
import { askProcessOnUnauthenticate, isWebSocketUnauthenticateMessage } from './askProcessOnUnauthenticate';

const authenticatedConnection = {
  id: 'c1',
  requestTime: 't',
  requestTimeEpoch: 1,
  ip: '1.1.1.1',
  userId: 'u1',
  accessToken: 'token-1',
  scope: 'tenant-a',
};

describe('isWebSocketUnauthenticateMessage', () => {
  it('accepts an unauthenticate message', () => {
    expect(isWebSocketUnauthenticateMessage({ type: WebSocketQueueClientMessageEventType.Unauthenticate } as any)).toBe(true);
  });

  it('rejects a non-unauthenticate message', () => {
    expect(isWebSocketUnauthenticateMessage({ type: WebSocketQueueClientMessageEventType.Ping } as any)).toBe(false);
  });
});

describe('askProcessOnUnauthenticate', () => {
  it('does nothing when the connection does not exist', () => {
    let sendCalled = false;

    runStory(askProcessOnUnauthenticate('c1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: { items: [] },
      [WebsocketActionType.SendMessage]: () => {
        sendCalled = true;
        return undefined;
      },
    });

    expect(sendCalled).toBe(false);
  });

  it('strips the user info and tenant claim and notifies the connection it is unauthenticated', () => {
    let upsert: any;
    let send: any;

    runStory(askProcessOnUnauthenticate('c1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: { items: [authenticatedConnection] },
      [KeyValueStoreActionType.Upsert]: (action: any) => {
        upsert = action;
        return undefined;
      },
      [WebsocketActionType.SendMessage]: (action: any) => {
        send = action;
        return undefined;
      },
    });

    expect(upsert.payload.item).toEqual({ id: 'c1', requestTime: 't', requestTimeEpoch: 1, ip: '1.1.1.1' });
    expect(send.payload.payload).toEqual({ type: WebSocketQueueServerMessageEventType.Unauthenticated });
  });
});
