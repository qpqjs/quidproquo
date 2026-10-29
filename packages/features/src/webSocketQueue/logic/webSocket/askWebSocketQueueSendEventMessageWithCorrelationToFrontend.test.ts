import { ContextActionType, KeyValueStoreActionType } from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';
import { askWebsocketSendMessageBase, WebsocketActionType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { askWebSocketQueueSendEventMessageWithCorrelationToFrontend } from './askWebSocketQueueSendEventMessageWithCorrelationToFrontend';

const message = { type: 'some-event', correlationId: 'corr' } as any;

describe('askWebSocketQueueSendEventMessageWithCorrelationToFrontend', () => {
  it('sends directly to the connection when the send succeeds', () => {
    const sends: any[] = [];

    runStory(askWebSocketQueueSendEventMessageWithCorrelationToFrontend(message, 'direct'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [WebsocketActionType.SendMessage]: (action: any) => {
        sends.push(action.payload.connectionId);
        return undefined;
      },
    });

    expect(sends).toEqual(['direct']);
  });

  it('fills the correlation id from the connection info when the payload lacks one', () => {
    let captured: any;

    runStory(askWebSocketQueueSendEventMessageWithCorrelationToFrontend({ type: 'some-event' } as any, 'direct'), {
      [ContextActionType.Read]: { apiName: 'demo', correlationId: 'from-context' },
      [WebsocketActionType.SendMessage]: (action: any) => {
        captured = action;
        return undefined;
      },
    });

    expect(captured.payload.payload.correlationId).toBe('from-context');
  });

  it('falls back to the user connections when the direct send fails and a user is given', () => {
    const sends: any[] = [];
    const deletes: any[] = [];

    runStory(askWebSocketQueueSendEventMessageWithCorrelationToFrontend(message, 'direct', 'u1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      // The connection store answers the user lookup; the subscriptions store has nothing for the dead connection.
      [KeyValueStoreActionType.Query]: (action: any) => ({ items: action.payload.keyValueStoreName === 'qpq-wsq-demo' ? [{ id: 'user-conn' }] : [] }),
      [KeyValueStoreActionType.Delete]: (action: any) => {
        deletes.push(action.payload.key);
        return undefined;
      },
      [WebsocketActionType.SendMessage]: (action: any) => {
        const connectionId = action.payload.connectionId;
        sends.push(connectionId);
        if (connectionId === 'direct') {
          return throwsError(askWebsocketSendMessageBase.errorType.Disconnected, 'gone');
        }
        return undefined;
      },
    });

    expect(sends).toEqual(['direct', 'user-conn']);
    expect(deletes).toEqual(['direct']);
  });

  it('broadcasts to everyone when neither a connection nor a user is given', () => {
    const sends: any[] = [];

    runStory(askWebSocketQueueSendEventMessageWithCorrelationToFrontend(message), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Scan]: { items: [{ id: 'a' }, { id: 'b' }] },
      [WebsocketActionType.SendMessage]: (action: any) => {
        sends.push(action.payload.connectionId);
        return undefined;
      },
    });

    expect(sends).toEqual(['a', 'b']);
  });

  it('keeps broadcasting past a dead connection and deletes its stale record and subscriptions', () => {
    const sends: any[] = [];
    const deletes: any[] = [];

    runStory(askWebSocketQueueSendEventMessageWithCorrelationToFrontend(message), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Scan]: { items: [{ id: 'a' }, { id: 'dead' }, { id: 'b' }] },
      [KeyValueStoreActionType.Query]: (action: any) => ({
        items: action.payload.keyValueStoreName === 'qpq-wsq-subs-demo' ? [{ topic: 'scope#topic', connectionId: 'dead' }] : [],
      }),
      [KeyValueStoreActionType.Delete]: (action: any) => {
        deletes.push([action.payload.keyValueStoreName, action.payload.key, action.payload.sortKey]);
        return undefined;
      },
      [WebsocketActionType.SendMessage]: (action: any) => {
        const connectionId = action.payload.connectionId;
        sends.push(connectionId);
        if (connectionId === 'dead') {
          return throwsError(askWebsocketSendMessageBase.errorType.Disconnected, 'Connection no longer exists');
        }
        return undefined;
      },
    });

    expect(sends).toEqual(['a', 'dead', 'b']);
    expect(deletes).toEqual([
      ['qpq-wsq-demo', 'dead', undefined],
      ['qpq-wsq-subs-demo', 'scope#topic', 'dead'],
    ]);
  });

  it('skips a throttled connection without deleting its record or aborting the loop', () => {
    const sends: any[] = [];
    const deletes: any[] = [];

    runStory(askWebSocketQueueSendEventMessageWithCorrelationToFrontend(message), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Scan]: { items: [{ id: 'a' }, { id: 'busy' }, { id: 'b' }] },
      [KeyValueStoreActionType.Delete]: (action: any) => {
        deletes.push(action.payload.key);
        return undefined;
      },
      [WebsocketActionType.SendMessage]: (action: any) => {
        const connectionId = action.payload.connectionId;
        sends.push(connectionId);
        if (connectionId === 'busy') {
          return throwsError(askWebsocketSendMessageBase.errorType.Throttled, 'slow down');
        }
        return undefined;
      },
    });

    expect(sends).toEqual(['a', 'busy', 'b']);
    expect(deletes).toEqual([]);
  });
});
