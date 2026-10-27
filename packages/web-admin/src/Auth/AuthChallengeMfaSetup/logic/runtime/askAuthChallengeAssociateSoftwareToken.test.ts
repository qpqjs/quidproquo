import { ContextActionType, DateActionType, GuidActionType, NetworkActionType, runStory, StateActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { AuthChallengeMfaSetupEffect } from '../authChallengeTypes';
import { askAuthChallengeAssociateSoftwareToken } from './askAuthChallengeAssociateSoftwareToken';

const baseMocks = (dispatched: unknown[], networkRequest: unknown) => ({
  [ContextActionType.Read]: { api: 'https://api', ws: 'wss://api' },
  [DateActionType.Now]: '2026-06-26T00:00:00.000Z',
  [GuidActionType.New]: 'guid-1',
  [NetworkActionType.Request]: networkRequest,
  [StateActionType.Dispatch]: (action: { payload: { action: unknown } }) => {
    dispatched.push(action.payload.action);
  },
});

describe('askAuthChallengeAssociateSoftwareToken', () => {
  it('stores the secret code and refreshed session on success', () => {
    const dispatched: unknown[] = [];

    runStory(
      askAuthChallengeAssociateSoftwareToken('sess'),
      baseMocks(dispatched, { status: 200, data: { secretCode: 'SECRET', session: 'NEW_SESSION' } }),
    );

    expect(dispatched).toContainEqual({
      type: AuthChallengeMfaSetupEffect.SetAssociation,
      payload: { secretCode: 'SECRET', session: 'NEW_SESSION' },
    });
  });

  it('does not store an association when the request fails', () => {
    const dispatched: unknown[] = [];

    runStory(askAuthChallengeAssociateSoftwareToken('sess'), baseMocks(dispatched, { status: 400, data: {} }));

    expect(dispatched).not.toContainEqual(expect.objectContaining({ type: AuthChallengeMfaSetupEffect.SetAssociation }));
  });
});
