import { describe, expect, it } from 'vitest';

import { AuthChallengeMfaSetupEffect } from './effects/AuthChallengeMfaSetupEffect';
import { createInitialAuthChallengeMfaSetupState } from './logic/createInitialAuthChallengeMfaSetupState';
import { authChallengeMfaSetupReducer } from './authChallengeMfaSetupReducer';

const authChallengeMfaSetupInitialState = createInitialAuthChallengeMfaSetupState();

describe('authChallengeMfaSetupReducer', () => {
  it('sets the mfa code', () => {
    const [state] = authChallengeMfaSetupReducer(authChallengeMfaSetupInitialState, {
      type: AuthChallengeMfaSetupEffect.SetMfaCode,
      payload: '123456',
    });

    expect(state.mfaCode).toBe('123456');
  });

  it('sets the secret code and session from an association', () => {
    const [state] = authChallengeMfaSetupReducer(authChallengeMfaSetupInitialState, {
      type: AuthChallengeMfaSetupEffect.SetAssociation,
      payload: { secretCode: 'SECRET', session: 'SESSION' },
    });

    expect(state.secretCode).toBe('SECRET');
    expect(state.session).toBe('SESSION');
  });

  it('does not handle an unknown effect', () => {
    const [, handled] = authChallengeMfaSetupReducer(authChallengeMfaSetupInitialState, { type: 'unknown', payload: undefined } as never);

    expect(handled).toBe(false);
  });
});
