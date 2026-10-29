import { StateActionType } from '@qpqjs/core';
import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { AuthChallengeEffect } from '../effects/AuthChallengeEffect';
import { askAuthChallengeSetPasswordA } from './askAuthChallengeSetPasswordA';

describe('askAuthChallengeSetPasswordA', () => {
  it('dispatches a SetPasswordA effect', () => {
    const { action } = captureRequester(askAuthChallengeSetPasswordA('a'));

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: AuthChallengeEffect.SetPasswordA, payload: 'a' } },
    });
  });
});
