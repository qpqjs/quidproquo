import { ConfigActionType, ContextActionType, InlineFunctionActionType, KeyValueStoreActionType, UserDirectoryActionType } from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askConnectionTryAuthenticate } from './askConnectionTryAuthenticate';

const baseConnection = { id: 'c1', requestTime: 't', requestTimeEpoch: 1, ip: '1.1.1.1' };

const userDirectoryGlobals = (action: any) => (action.payload.globalName === 'qpq-wsq-kvs-name-demo' ? 'user-directory' : '');

describe('askConnectionTryAuthenticate', () => {
  it('does nothing when no user directory is configured', () => {
    let setAccessTokenCalled = false;

    runStory(askConnectionTryAuthenticate('c1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [ConfigActionType.GetGlobal]: '',
      [UserDirectoryActionType.SetAccessToken]: () => {
        setAccessTokenCalled = true;
        return { userId: 'u1' };
      },
    });

    expect(setAccessTokenCalled).toBe(false);
  });

  it('sets the access token into the session when the connection has one', () => {
    let captured: any;

    runStory(askConnectionTryAuthenticate('c1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [ConfigActionType.GetGlobal]: userDirectoryGlobals,
      [KeyValueStoreActionType.Query]: { items: [{ ...baseConnection, accessToken: 'token-1' }] },
      [UserDirectoryActionType.SetAccessToken]: (action: any) => {
        captured = action;
        return { userId: 'u1' };
      },
    });

    expect(captured.payload).toEqual({ userDirectoryName: 'user-directory', accessToken: 'token-1' });
  });

  it('does not set an access token when the connection has none', () => {
    let setAccessTokenCalled = false;

    runStory(askConnectionTryAuthenticate('c1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [ConfigActionType.GetGlobal]: userDirectoryGlobals,
      [KeyValueStoreActionType.Query]: { items: [baseConnection] },
      [UserDirectoryActionType.SetAccessToken]: () => {
        setAccessTokenCalled = true;
        return { userId: 'u1' };
      },
    });

    expect(setAccessTokenCalled).toBe(false);
  });

  describe('with a connectionAuthenticator', () => {
    const globals = (action: any) => (action.payload.globalName === 'qpq-wsq-authenticator-demo' ? 'authenticateSigner' : '');

    it('re-runs the authenticator against the stored token and returns the connection', () => {
      let setAccessTokenCalled = false;
      let input: any;

      const result = runStory(askConnectionTryAuthenticate('c1'), {
        [ContextActionType.Read]: { apiName: 'demo' },
        [ConfigActionType.GetGlobal]: globals,
        [KeyValueStoreActionType.Query]: { items: [{ ...baseConnection, accessToken: 'session-1', scope: 'TENANT#t1', userId: 'signer:s1' }] },
        [InlineFunctionActionType.Execute]: (action: any) => {
          input = action.payload.payload;
          return { userId: 'signer:s1', scope: 'TENANT#t1' };
        },
        [UserDirectoryActionType.SetAccessToken]: () => {
          setAccessTokenCalled = true;
          return { userId: 'u1' };
        },
      });

      expect(input).toEqual({ accessToken: 'session-1', requestedScope: 'TENANT#t1' });
      expect(setAccessTokenCalled).toBe(false);
      expect(result?.userId).toBe('signer:s1');
    });

    it('makes the principal the session user when the authenticator names one', () => {
      let stamped: any;

      runStory(askConnectionTryAuthenticate('c1'), {
        [ContextActionType.Read]: { apiName: 'demo' },
        [ConfigActionType.GetGlobal]: globals,
        [KeyValueStoreActionType.Query]: { items: [{ ...baseConnection, accessToken: 'session-1', userId: 'guest:g1' }] },
        [InlineFunctionActionType.Execute]: { userId: 'guest:g1', sessionUser: { username: 'Ada', exp: 4102444800 } },
        [UserDirectoryActionType.SetDecodedAccessToken]: (action: any) => {
          stamped = action.payload.decodedAccessToken;
        },
      });

      expect(stamped).toMatchObject({ userId: 'guest:g1', username: 'Ada', exp: 4102444800, wasValid: true });
    });

    it('sets no session user when the authenticator names none', () => {
      let stamped = false;

      runStory(askConnectionTryAuthenticate('c1'), {
        [ContextActionType.Read]: { apiName: 'demo' },
        [ConfigActionType.GetGlobal]: globals,
        [KeyValueStoreActionType.Query]: { items: [{ ...baseConnection, accessToken: 'session-1', userId: 'signer:s1' }] },
        [InlineFunctionActionType.Execute]: { userId: 'signer:s1', scope: 'TENANT#t1' },
        [UserDirectoryActionType.SetDecodedAccessToken]: () => {
          stamped = true;
        },
      });

      expect(stamped).toBe(false);
    });

    it('propagates the authenticator refusal', () => {
      const run = () =>
        runStory(askConnectionTryAuthenticate('c1'), {
          [ContextActionType.Read]: { apiName: 'demo' },
          [ConfigActionType.GetGlobal]: globals,
          [KeyValueStoreActionType.Query]: { items: [{ ...baseConnection, accessToken: 'stale' }] },
          [InlineFunctionActionType.Execute]: throwsError('Unauthorized', 'expired'),
        });

      expect(run).toThrow();
    });
  });
});
