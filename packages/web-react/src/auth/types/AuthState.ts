import { AuthenticationInfo } from '@qpqjs/core';

export type AuthState = {
  challenge?: string;
  session?: string;
  username: string;

  authenticationInfo?: AuthenticationInfo;
};
