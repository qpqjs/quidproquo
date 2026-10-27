import { AuthenticateUserChallenge, AuthenticateUserResponse } from 'quidproquo-core';

// Tokens deliberately live in memory only — never localStorage — so a page
// refresh forces a fresh login and with it a fresh admin session doc.
let currentAuthToken: AuthenticateUserResponse | null = null;

export const getInMemoryAuthToken = (): AuthenticateUserResponse =>
  currentAuthToken ?? {
    challenge: AuthenticateUserChallenge.NONE,
  };

export const setInMemoryAuthToken = (authToken: AuthenticateUserResponse): void => {
  currentAuthToken = authToken;
};

export const clearInMemoryAuthToken = (): void => {
  currentAuthToken = null;
};
