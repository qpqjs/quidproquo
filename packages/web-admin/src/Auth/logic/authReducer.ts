import { buildMutableEffectReducer } from 'quidproquo-core';

import { AuthEffect, AuthEffects, AuthState } from './authTypes';

export const authInitalState: AuthState = {
  username: '',
  password: '',
};

export const authReducer = buildMutableEffectReducer<AuthState, AuthEffects>({
  [AuthEffect.SetUsername]: (state, username) => {
    state.username = username;
  },

  [AuthEffect.SetPassword]: (state, password) => {
    state.password = password;
  },

  [AuthEffect.SetAuthInfo]: (state, authenticateUserResponse) => {
    state.authenticateUserResponse = authenticateUserResponse;
  },
});
