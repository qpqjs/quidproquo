import {
  ConfigActionType,
  ContextActionType,
  EventBusActionType,
  InlineFunctionActionType,
  KeyValueStoreActionType,
  runStory,
  throwsError,
  UserDirectoryActionType,
} from '@qpqjs/core';
import { WebsocketActionType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { WebSocketQueueClientMessageEventType, WebSocketQueueServerMessageEventType } from '../../../types';
import { askProcessOnAuthenticate, isWebSocketAuthenticateMessage } from './askProcessOnAuthenticate';

const connection = { id: 'c1', requestTime: 't', requestTimeEpoch: 1, ip: '1.1.1.1' };

const globalByKey = (values: Record<string, string>) => (action: any) => values[action.payload.globalName] ?? '';

// The connection row from the connections store; the subscriptions store answers with whatever the test files there.
const queryByStore =
  (subscriptions: { topic: string; connectionId: string }[] = []) =>
  (action: any) => ({ items: action.payload.keyValueStoreName === 'qpq-wsq-subs-demo' ? subscriptions : [connection] });

describe('isWebSocketAuthenticateMessage', () => {
  it('accepts an authenticate message', () => {
    expect(isWebSocketAuthenticateMessage({ type: WebSocketQueueClientMessageEventType.Authenticate } as any)).toBe(true);
  });

  it('rejects a non-authenticate message', () => {
    expect(isWebSocketAuthenticateMessage({ type: WebSocketQueueClientMessageEventType.Ping } as any)).toBe(false);
  });
});

describe('askProcessOnAuthenticate', () => {
  it('notifies the connection it is unauthenticated when the connection does not exist', () => {
    let setAccessTokenCalled = false;
    const sends: any[] = [];

    runStory(askProcessOnAuthenticate('c1', 'token-1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: { items: [] },
      [UserDirectoryActionType.SetAccessToken]: () => {
        setAccessTokenCalled = true;
        return { userId: 'u1' };
      },
      [WebsocketActionType.SendMessage]: (action: any) => {
        sends.push(action.payload.payload.type);
        return undefined;
      },
    });

    expect(sends).toEqual([WebSocketQueueServerMessageEventType.Unauthenticated]);
    expect(setAccessTokenCalled).toBe(false);
  });

  it('does nothing when no user directory is configured', () => {
    let setAccessTokenCalled = false;

    runStory(askProcessOnAuthenticate('c1', 'token-1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: { items: [connection] },
      [ConfigActionType.GetGlobal]: '',
      [UserDirectoryActionType.SetAccessToken]: () => {
        setAccessTokenCalled = true;
        return { userId: 'u1' };
      },
    });

    expect(setAccessTokenCalled).toBe(false);
  });

  it('clears the connection auth and notifies it is unauthenticated when the token is invalid', () => {
    const sends: any[] = [];
    let upsert: any;

    runStory(askProcessOnAuthenticate('c1', 'bad-token'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: { items: [{ ...connection, userId: 'old-user', accessToken: 'old-token', scope: 'old-tenant' }] },
      [ConfigActionType.GetGlobal]: globalByKey({ 'qpq-wsq-kvs-name-demo': 'user-directory' }),
      [UserDirectoryActionType.SetAccessToken]: throwsError('Unauthorized', 'bad'),
      [KeyValueStoreActionType.Upsert]: (action: any) => {
        upsert = action;
        return undefined;
      },
      [WebsocketActionType.SendMessage]: (action: any) => {
        sends.push(action.payload.payload.type);
        return undefined;
      },
    });

    expect(sends).toEqual([WebSocketQueueServerMessageEventType.Unauthenticated]);
    expect(upsert.payload.item).toEqual(connection);
  });

  it('stores the user, confirms authentication and broadcasts the authenticate event', () => {
    let upsert: any;
    const sends: any[] = [];
    let broadcast: any;

    runStory(askProcessOnAuthenticate('c1', 'token-1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: queryByStore(),
      [ConfigActionType.GetGlobal]: globalByKey({
        'qpq-wsq-kvs-name-demo': 'user-directory',
        'qpq-wsq-eb-name-demo': 'event-bus',
      }),
      [UserDirectoryActionType.SetAccessToken]: { userId: 'u1' },
      [KeyValueStoreActionType.Upsert]: (action: any) => {
        upsert = action;
        return undefined;
      },
      [WebsocketActionType.SendMessage]: (action: any) => {
        sends.push(action.payload.payload.type);
        return undefined;
      },
      [EventBusActionType.SendMessages]: (action: any) => {
        broadcast = action;
        return undefined;
      },
    });

    expect(upsert.payload.item).toEqual({ ...connection, userId: 'u1', accessToken: 'token-1' });
    expect(sends).toEqual([WebSocketQueueServerMessageEventType.Authenticated]);
    expect(broadcast.payload.eventBusName).toBe('event-bus');
    expect(broadcast.payload.eventBusMessages).toEqual([{ type: WebSocketQueueClientMessageEventType.Authenticate, payload: {} }]);
  });

  it('stores the scope the resolver returns for a tenant claim', () => {
    let upsert: any;
    let resolverCall: any;
    const sends: any[] = [];

    runStory(askProcessOnAuthenticate('c1', 'token-1', 'tenant-a'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: queryByStore(),
      [ConfigActionType.GetGlobal]: globalByKey({
        'qpq-wsq-kvs-name-demo': 'user-directory',
        'qpq-wsq-eb-name-demo': 'event-bus',
        'qpq-wsq-scope-resolver-demo': 'resolveTenantScope',
      }),
      [UserDirectoryActionType.SetAccessToken]: { userId: 'u1' },
      [InlineFunctionActionType.Execute]: (action: any) => {
        resolverCall = action.payload;
        return 'TENANT#tenant-a';
      },
      [KeyValueStoreActionType.Upsert]: (action: any) => {
        upsert = action;
        return undefined;
      },
      [WebsocketActionType.SendMessage]: (action: any) => {
        sends.push(action.payload.payload.type);
        return undefined;
      },
      [EventBusActionType.SendMessages]: undefined,
    });

    expect(resolverCall).toEqual({ functionName: 'resolveTenantScope', payload: { userId: 'u1', requestedScope: 'tenant-a' } });
    expect(upsert.payload.item.scope).toBe('TENANT#tenant-a');
    expect(sends).toEqual([WebSocketQueueServerMessageEventType.Authenticated]);
  });

  it('stores the resolved personal scope when authenticating without a claim on a resolver queue', () => {
    let upsert: any;
    let resolverCall: any;

    runStory(askProcessOnAuthenticate('c1', 'token-1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: queryByStore(),
      [ConfigActionType.GetGlobal]: globalByKey({
        'qpq-wsq-kvs-name-demo': 'user-directory',
        'qpq-wsq-eb-name-demo': 'event-bus',
        'qpq-wsq-scope-resolver-demo': 'resolveTenantScope',
      }),
      [UserDirectoryActionType.SetAccessToken]: { userId: 'u1' },
      [InlineFunctionActionType.Execute]: (action: any) => {
        resolverCall = action.payload;
        return 'PERSONAL#u1';
      },
      [KeyValueStoreActionType.Upsert]: (action: any) => {
        upsert = action;
        return undefined;
      },
      [WebsocketActionType.SendMessage]: undefined,
      [EventBusActionType.SendMessages]: undefined,
    });

    expect(resolverCall).toEqual({ functionName: 'resolveTenantScope', payload: { userId: 'u1', requestedScope: null } });
    expect(upsert.payload.item.scope).toBe('PERSONAL#u1');
  });

  it('clears the connection auth when the resolver rejects the claim', () => {
    let upsert: any;
    const sends: any[] = [];

    runStory(askProcessOnAuthenticate('c1', 'token-1', 'tenant-b'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: { items: [{ ...connection, userId: 'old-user', accessToken: 'old-token', scope: 'old-tenant' }] },
      [ConfigActionType.GetGlobal]: globalByKey({
        'qpq-wsq-kvs-name-demo': 'user-directory',
        'qpq-wsq-scope-resolver-demo': 'resolveTenantScope',
      }),
      [UserDirectoryActionType.SetAccessToken]: { userId: 'u1' },
      [InlineFunctionActionType.Execute]: throwsError('Forbidden', 'not a member'),
      [KeyValueStoreActionType.Upsert]: (action: any) => {
        upsert = action;
        return undefined;
      },
      [WebsocketActionType.SendMessage]: (action: any) => {
        sends.push(action.payload.payload.type);
        return undefined;
      },
    });

    expect(sends).toEqual([WebSocketQueueServerMessageEventType.Unauthenticated]);
    expect(upsert.payload.item).toEqual(connection);
  });

  it('clears the connection auth when a tenant is claimed but no scope resolver is configured', () => {
    let upsert: any;
    const sends: any[] = [];

    runStory(askProcessOnAuthenticate('c1', 'token-1', 'tenant-a'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: { items: [{ ...connection, userId: 'old-user', accessToken: 'old-token', scope: 'old-tenant' }] },
      [ConfigActionType.GetGlobal]: globalByKey({ 'qpq-wsq-kvs-name-demo': 'user-directory' }),
      [UserDirectoryActionType.SetAccessToken]: { userId: 'u1' },
      [KeyValueStoreActionType.Upsert]: (action: any) => {
        upsert = action;
        return undefined;
      },
      [WebsocketActionType.SendMessage]: (action: any) => {
        sends.push(action.payload.payload.type);
        return undefined;
      },
    });

    expect(sends).toEqual([WebSocketQueueServerMessageEventType.Unauthenticated]);
    expect(upsert.payload.item).toEqual(connection);
  });

  it('clears a previous scope when re-authenticating without a claim on a plain queue', () => {
    let upsert: any;

    runStory(askProcessOnAuthenticate('c1', 'token-1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: (action: any) => ({
        items: action.payload.keyValueStoreName === 'qpq-wsq-subs-demo' ? [] : [{ ...connection, scope: 'tenant-a' }],
      }),
      [ConfigActionType.GetGlobal]: globalByKey({
        'qpq-wsq-kvs-name-demo': 'user-directory',
        'qpq-wsq-eb-name-demo': 'event-bus',
      }),
      [UserDirectoryActionType.SetAccessToken]: { userId: 'u1' },
      [KeyValueStoreActionType.Upsert]: (action: any) => {
        upsert = action;
        return undefined;
      },
      [WebsocketActionType.SendMessage]: undefined,
      [EventBusActionType.SendMessages]: undefined,
    });

    expect(upsert.payload.item.scope).toBeUndefined();
  });
  it('drops the subscriptions filed under the previous authentication', () => {
    const deletes: [string, string, string | undefined][] = [];

    runStory(askProcessOnAuthenticate('c1', 'token-1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Query]: queryByStore([{ topic: 'TENANT#old#eventDoc#docs#1', connectionId: 'c1' }]),
      [ConfigActionType.GetGlobal]: globalByKey({ 'qpq-wsq-kvs-name-demo': 'user-directory', 'qpq-wsq-eb-name-demo': 'event-bus' }),
      [UserDirectoryActionType.SetAccessToken]: { userId: 'u1' },
      [KeyValueStoreActionType.Upsert]: undefined,
      [KeyValueStoreActionType.Delete]: (action: any) => {
        deletes.push([action.payload.keyValueStoreName, action.payload.key, action.payload.sortKey]);
        return undefined;
      },
      [WebsocketActionType.SendMessage]: undefined,
      [EventBusActionType.SendMessages]: undefined,
    });

    expect(deletes).toEqual([['qpq-wsq-subs-demo', 'TENANT#old#eventDoc#docs#1', 'c1']]);
  });

  describe('with a connectionAuthenticator', () => {
    const globals = globalByKey({ 'qpq-wsq-authenticator-demo': 'authenticateSigner', 'qpq-wsq-eb-name-demo': 'event-bus' });

    it('stores the principal the authenticator returns and never touches the user directory', () => {
      let setAccessTokenCalled = false;
      const executed: any[] = [];
      const sends: any[] = [];
      let upsert: any;

      runStory(askProcessOnAuthenticate('c1', 'session-1'), {
        [ContextActionType.Read]: { apiName: 'demo' },
        [KeyValueStoreActionType.Query]: queryByStore(),
        [ConfigActionType.GetGlobal]: globals,
        [UserDirectoryActionType.SetAccessToken]: () => {
          setAccessTokenCalled = true;
          return { userId: 'u1' };
        },
        [InlineFunctionActionType.Execute]: (action: any) => {
          executed.push([action.payload.functionName, action.payload.payload]);
          return { userId: 'signer:s1', scope: 'TENANT#t1' };
        },
        [KeyValueStoreActionType.Upsert]: (action: any) => {
          upsert = action;
          return undefined;
        },
        [WebsocketActionType.SendMessage]: (action: any) => {
          sends.push(action.payload.payload.type);
          return undefined;
        },
        [EventBusActionType.SendMessages]: undefined,
      });

      expect(setAccessTokenCalled).toBe(false);
      expect(executed).toEqual([['authenticateSigner', { accessToken: 'session-1', requestedScope: null }]]);
      expect(upsert.payload.item).toEqual({ ...connection, userId: 'signer:s1', accessToken: 'session-1', scope: 'TENANT#t1' });
      expect(sends).toEqual([WebSocketQueueServerMessageEventType.Authenticated]);
    });

    it('hands a scope claim to the authenticator', () => {
      let input: any;

      runStory(askProcessOnAuthenticate('c1', 'session-1', 'TENANT#t1'), {
        [ContextActionType.Read]: { apiName: 'demo' },
        [KeyValueStoreActionType.Query]: queryByStore(),
        [ConfigActionType.GetGlobal]: globals,
        [InlineFunctionActionType.Execute]: (action: any) => {
          input = action.payload.payload;
          return { userId: 'signer:s1' };
        },
        [KeyValueStoreActionType.Upsert]: undefined,
        [WebsocketActionType.SendMessage]: undefined,
        [EventBusActionType.SendMessages]: undefined,
      });

      expect(input).toEqual({ accessToken: 'session-1', requestedScope: 'TENANT#t1' });
    });

    it('clears the connection auth and notifies it is unauthenticated when the authenticator throws', () => {
      const sends: any[] = [];
      let upsert: any;

      runStory(askProcessOnAuthenticate('c1', 'stale-session'), {
        [ContextActionType.Read]: { apiName: 'demo' },
        [KeyValueStoreActionType.Query]: queryByStore(),
        [ConfigActionType.GetGlobal]: globals,
        [InlineFunctionActionType.Execute]: throwsError('Unauthorized', 'expired'),
        [KeyValueStoreActionType.Upsert]: (action: any) => {
          upsert = action;
          return undefined;
        },
        [WebsocketActionType.SendMessage]: (action: any) => {
          sends.push(action.payload.payload.type);
          return undefined;
        },
      });

      expect(upsert.payload.item).toEqual(connection);
      expect(sends).toEqual([WebSocketQueueServerMessageEventType.Unauthenticated]);
    });
  });
});
