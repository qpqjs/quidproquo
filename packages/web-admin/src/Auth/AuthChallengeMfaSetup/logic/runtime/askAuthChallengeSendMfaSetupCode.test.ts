import { ContextActionType, DateActionType, GuidActionType, NetworkActionType, runStory, StateActionType } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearInMemoryAuthToken } from '../../../../platformLogic';
import { AuthEffect } from '../../../logic/authTypes';
import { askAuthChallengeSendMfaSetupCode } from './askAuthChallengeSendMfaSetupCode';

const baseMocks = (dispatched: string[], networkRequest: unknown) => ({
  [StateActionType.Read]: { mfaCode: '123456', session: 'sess-from-state' },
  [ContextActionType.Read]: { api: 'https://api', ws: 'wss://api' },
  [DateActionType.Now]: '2026-06-26T00:00:00.000Z',
  [GuidActionType.New]: 'guid-1',
  [NetworkActionType.Request]: networkRequest,
  [StateActionType.Dispatch]: (action: { payload: { action: { type: string } } }) => {
    dispatched.push(action.payload.action.type);
  },
});

describe('askAuthChallengeSendMfaSetupCode', () => {
  beforeEach(() => {
    clearInMemoryAuthToken();
  });

  it('posts the mfa code with the refreshed session from state', () => {
    const dispatched: string[] = [];
    const networkRequest = vi.fn(() => ({ status: 200, data: { challenge: 'NONE' } }));

    runStory(askAuthChallengeSendMfaSetupCode('MFA_SETUP', 'joe@x.com'), baseMocks(dispatched, networkRequest));

    const action = networkRequest.mock.calls[0][0] as { payload: { body: { mfaCode: string; session: string } } };
    expect(action.payload.body).toMatchObject({ mfaCode: '123456', session: 'sess-from-state' });
    expect(dispatched).toContain(AuthEffect.SetAuthInfo);
  });

  it('does not set auth info when the request fails', () => {
    const dispatched: string[] = [];

    runStory(askAuthChallengeSendMfaSetupCode('MFA_SETUP', 'joe@x.com'), baseMocks(dispatched, { status: 500, data: {} }));

    expect(dispatched).not.toContain(AuthEffect.SetAuthInfo);
  });
});
