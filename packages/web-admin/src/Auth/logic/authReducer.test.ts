import { describe, expect, it } from 'vitest';

import { authInitalState, authReducer } from './authReducer';
import { AuthEffect } from './authTypes';

describe('authReducer', () => {
  it('sets the username', () => {
    const [state, handled] = authReducer(authInitalState, { type: AuthEffect.SetUsername, payload: 'joe' });

    expect(state.username).toBe('joe');
    expect(handled).toBe(true);
  });

  it('sets the password', () => {
    const [state] = authReducer(authInitalState, { type: AuthEffect.SetPassword, payload: 'secret' });

    expect(state.password).toBe('secret');
  });

  it('sets the auth info', () => {
    const authenticateUserResponse = { challenge: undefined } as never;
    const [state] = authReducer(authInitalState, { type: AuthEffect.SetAuthInfo, payload: authenticateUserResponse });

    expect(state.authenticateUserResponse).toBe(authenticateUserResponse);
  });

  it('leaves state unchanged for an unknown effect', () => {
    const [state, handled] = authReducer(authInitalState, { type: 'auth/Unknown', payload: 'x' } as never);

    expect(state).toBe(authInitalState);
    expect(handled).toBe(false);
  });
});
