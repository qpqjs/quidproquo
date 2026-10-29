import { AuthenticateUserResponse } from '@qpqjs/core';

export type AuthState = {
  username: string;
  password: string;
  authenticateUserResponse?: AuthenticateUserResponse;
};
