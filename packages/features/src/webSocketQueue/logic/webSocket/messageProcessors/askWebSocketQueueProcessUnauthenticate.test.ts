import { ContextActionType, KeyValueStoreActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';
import { WebsocketActionType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { WebSocketQueueClientMessageEventType, WebSocketQueueServerMessageEventType } from '../../../types';
import { askWebSocketQueueProcessUnauthenticate, isWebSocketUnauthenticateMessage } from './askWebSocketQueueProcessUnauthenticate';

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

describe('askWebSocketQueueProcessUnauthenticate', () => {
  it('does nothing when the connection does not exist', () => {
    let sendCalled = false;

    runStory(askWebSocketQueueProcessUnauthenticate('c1'), {
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

    runStory(askWebSocketQueueProcessUnauthenticate('c1'), {
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
