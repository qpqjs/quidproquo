import { AuthenticateUserResponse } from '@qpqjs/core';

import { AuthState } from '../types/AuthState';

export const setAuthInfo = (state: AuthState, authenticateUserResponse: AuthenticateUserResponse): AuthState => ({
  ...state,
  authenticateUserResponse,
});
