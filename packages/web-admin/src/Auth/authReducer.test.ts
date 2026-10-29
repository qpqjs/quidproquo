import { describe, expect, it } from 'vitest';

import { AuthEffect } from './effects/AuthEffect';
import { createInitialAuthState } from './logic/createInitialAuthState';
import { authReducer } from './authReducer';

const authInitialState = createInitialAuthState();

describe('authReducer', () => {
  it('sets the username', () => {
    const [state, handled] = authReducer(authInitialState, { type: AuthEffect.SetUsername, payload: 'joe' });

    expect(state.username).toBe('joe');
    expect(handled).toBe(true);
  });

  it('sets the password', () => {
    const [state] = authReducer(authInitialState, { type: AuthEffect.SetPassword, payload: 'secret' });

    expect(state.password).toBe('secret');
  });

  it('sets the auth info', () => {
    const authenticateUserResponse = { challenge: undefined } as never;
    const [state] = authReducer(authInitialState, { type: AuthEffect.SetAuthInfo, payload: authenticateUserResponse });

    expect(state.authenticateUserResponse).toBe(authenticateUserResponse);
  });

  it('leaves state unchanged for an unknown effect', () => {
    const [state, handled] = authReducer(authInitialState, { type: 'auth/Unknown', payload: 'x' } as never);

    expect(state).toBe(authInitialState);
    expect(handled).toBe(false);
  });
});
