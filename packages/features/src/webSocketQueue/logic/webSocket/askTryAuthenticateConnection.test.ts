import { ConfigActionType, ContextActionType, InlineFunctionActionType, KeyValueStoreActionType, UserDirectoryActionType } from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askTryAuthenticateConnection } from './askTryAuthenticateConnection';

const baseConnection = { id: 'c1', requestTime: 't', requestTimeEpoch: 1, ip: '1.1.1.1' };

const userDirectoryGlobals = (action: any) => (action.payload.globalName === 'qpq-wsq-kvs-name-demo' ? 'user-directory' : '');

describe('askTryAuthenticateConnection', () => {
  it('does nothing when no user directory is configured', () => {
    let setAccessTokenCalled = false;

    runStory(askTryAuthenticateConnection('c1'), {
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

    runStory(askTryAuthenticateConnection('c1'), {
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

    runStory(askTryAuthenticateConnection('c1'), {
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

      const result = runStory(askTryAuthenticateConnection('c1'), {
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

    it('propagates the authenticator refusal', () => {
      const run = () =>
        runStory(askTryAuthenticateConnection('c1'), {
          [ContextActionType.Read]: { apiName: 'demo' },
          [ConfigActionType.GetGlobal]: globals,
          [KeyValueStoreActionType.Query]: { items: [{ ...baseConnection, accessToken: 'stale' }] },
          [InlineFunctionActionType.Execute]: throwsError('Unauthorized', 'expired'),
        });

      expect(run).toThrow();
    });
  });
});
