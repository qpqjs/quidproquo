import { ContextActionType, DateActionType, GuidActionType, NetworkActionType, runStory, StateActionType } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearInMemoryAuthToken } from '../../../../platformLogic';
import { AuthEffect } from '../../../logic/authTypes';
import { askAuthChallengeSendMfaCode } from './askAuthChallengeSendMfaCode';

const baseMocks = (dispatched: string[], networkRequest: unknown) => ({
  [StateActionType.Read]: { mfaCode: '123456' },
  [ContextActionType.Read]: { api: 'https://api', ws: 'wss://api' },
  [DateActionType.Now]: '2026-06-26T00:00:00.000Z',
  [GuidActionType.New]: 'guid-1',
  [NetworkActionType.Request]: networkRequest,
  [StateActionType.Dispatch]: (action: { payload: { action: { type: string } } }) => {
    dispatched.push(action.payload.action.type);
  },
});

describe('askAuthChallengeSendMfaCode', () => {
  beforeEach(() => {
    clearInMemoryAuthToken();
  });

  it('posts the mfa code and sets auth info on success', () => {
    const dispatched: string[] = [];
    const networkRequest = vi.fn(() => ({ status: 200, data: { challenge: 'NONE' } }));

    runStory(askAuthChallengeSendMfaCode('SOFTWARE_TOKEN_MFA', 'sess', 'joe@x.com'), baseMocks(dispatched, networkRequest));

    const action = networkRequest.mock.calls[0][0] as { payload: { body: { mfaCode: string } } };
    expect(action.payload.body.mfaCode).toBe('123456');
    expect(dispatched).toContain(AuthEffect.SetAuthInfo);
  });

  it('does not set auth info when the request fails', () => {
    const dispatched: string[] = [];

    runStory(askAuthChallengeSendMfaCode('SOFTWARE_TOKEN_MFA', 'sess', 'joe@x.com'), baseMocks(dispatched, { status: 400, data: {} }));

    expect(dispatched).not.toContain(AuthEffect.SetAuthInfo);
  });
});
