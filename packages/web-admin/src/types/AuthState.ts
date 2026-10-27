import { AuthenticationInfo } from 'quidproquo-core';

export type AuthState = {
  challenge?: string;
  session?: string;
  username: string;
  password: string;

  authenticationInfo?: AuthenticationInfo;
};
