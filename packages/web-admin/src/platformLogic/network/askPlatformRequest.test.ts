import {
  AuthenticateUserChallenge,
  AuthenticateUserResponse,
  ContextActionType,
  DateActionType,
  GuidActionType,
  NetworkActionType,
  runStory,
  StateActionType,
  StateDispatchAction,
} from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearInMemoryAuthToken, setInMemoryAuthToken } from '../config';
import { askPlatformRequest } from './askPlatformRequest';

const baseUrls = { api: 'https://api', ws: 'wss://api' };

const baseMocks = () => ({
  [ContextActionType.Read]: baseUrls,
  [StateActionType.Dispatch]: undefined,
  [DateActionType.Now]: '2026-06-26T00:00:00.000Z',
  [GuidActionType.New]: 'guid-1',
});

describe('askPlatformRequest', () => {
  beforeEach(() => {
    clearInMemoryAuthToken();
  });

  it('sends the request with the auth header and the api base path', () => {
    setInMemoryAuthToken({
      challenge: AuthenticateUserChallenge.NONE,
      authenticationInfo: { accessToken: 'tok' },
    } as unknown as AuthenticateUserResponse);

    const networkRequest = vi.fn(() => ({ status: 200, data: { ok: true } }));

    const result = runStory(askPlatformRequest('GET', '/thing'), {
      ...baseMocks(),
      [NetworkActionType.Request]: networkRequest,
    });

    expect(networkRequest).toHaveBeenCalledTimes(1);
    const action = networkRequest.mock.calls[0][0] as { payload: { headers: Record<string, string>; basePath: string } };
    expect(action.payload.headers.Authorization).toBe('Bearer tok');
    expect(action.payload.basePath).toBe(baseUrls.api);
    expect(result).toEqual({ status: 200, data: { ok: true } });
  });

  it('sends no auth header when no token is stored', () => {
    const networkRequest = vi.fn(() => ({ status: 200, data: { ok: true } }));

    runStory(askPlatformRequest('GET', '/thing'), {
      ...baseMocks(),
      [NetworkActionType.Request]: networkRequest,
    });

    const action = networkRequest.mock.calls[0][0] as { payload: { headers: Record<string, string> } };
    expect(action.payload.headers.Authorization).toBeUndefined();
  });

  it('shows an error dispatch when the response is not 2xx', () => {
    const dispatched: unknown[] = [];

    runStory(askPlatformRequest('GET', '/thing'), {
      ...baseMocks(),
      [NetworkActionType.Request]: { status: 500, data: {} },
      [StateActionType.Dispatch]: (action: StateDispatchAction<{ type: string }>) => {
        dispatched.push(action.payload.action.type);
      },
    });

    expect(dispatched).toContain('system/ShowError');
  });
});
