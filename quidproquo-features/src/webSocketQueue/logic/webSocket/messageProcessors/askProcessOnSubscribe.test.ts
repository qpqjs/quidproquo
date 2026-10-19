import {
  ConfigActionType,
  ContextActionType,
  ErrorTypeEnum,
  InlineFunctionActionType,
  KeyValueStoreActionType,
  runStory,
  throwsError,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { Connection, WebSocketQueueClientMessageEventType } from '../../../types';
import { askProcessOnSubscribe, isWebSocketSubscribeMessage } from './askProcessOnSubscribe';

const connection: Connection = { id: 'c1', requestTime: '', requestTimeEpoch: 0, ip: '', userId: 'u1', scope: 'TENANT#t1' };

const subscribe = (conn: Connection | null, topicAuthoriser = '', authoriserThrows = false) => {
  const upserts: any[] = [];
  const authorised: any[] = [];

  runStory(askProcessOnSubscribe(conn, 'eventDoc#docs#1'), {
    [ContextActionType.Read]: { apiName: 'demo' },
    [ConfigActionType.GetGlobal]: topicAuthoriser,
    [InlineFunctionActionType.Execute]: (action: any) => {
      authorised.push(action.payload.payload);
      if (authoriserThrows) {
        return throwsError(ErrorTypeEnum.Unauthorized, 'refused');
      }
      return undefined;
    },
    [KeyValueStoreActionType.Upsert]: (action: any) => {
      upserts.push([action.payload.keyValueStoreName, action.payload.item]);
      return undefined;
    },
  });

  return { upserts, authorised };
};

describe('isWebSocketSubscribeMessage', () => {
  it('accepts a subscribe message only', () => {
    expect(isWebSocketSubscribeMessage({ type: WebSocketQueueClientMessageEventType.Subscribe } as any)).toBe(true);
    expect(isWebSocketSubscribeMessage({ type: WebSocketQueueClientMessageEventType.Ping } as any)).toBe(false);
  });
});

describe('askProcessOnSubscribe', () => {
  it("files the subscription under the connection's own scope", () => {
    const { upserts } = subscribe(connection);

    expect(upserts).toEqual([['qpq-wsq-subs-demo', { topic: 'TENANT#t1#eventDoc#docs#1', connectionId: 'c1' }]]);
  });

  it('ignores an unauthenticated connection', () => {
    expect(subscribe({ ...connection, userId: undefined }).upserts).toEqual([]);
    expect(subscribe(null).upserts).toEqual([]);
  });

  it('asks the configured topic authoriser and files the subscription when it allows', () => {
    const { upserts, authorised } = subscribe(connection, 'authoriseTopic');

    expect(authorised).toEqual([{ connectionId: 'c1', userId: 'u1', scope: 'TENANT#t1', topic: 'eventDoc#docs#1' }]);
    expect(upserts).toHaveLength(1);
  });

  it('ignores the subscribe when the topic authoriser throws', () => {
    expect(subscribe(connection, 'authoriseTopic', true).upserts).toEqual([]);
  });
});
