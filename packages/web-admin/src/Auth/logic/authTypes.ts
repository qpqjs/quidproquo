import { AuthenticateUserResponse, Effect } from 'quidproquo-core';

export type AuthState = {
  username: string;
  password: string;
  authenticateUserResponse?: AuthenticateUserResponse;
};

export enum AuthEffect {
  SetUsername = 'auth/SetUsername',
  SetPassword = 'auth/SetPassword',
  SetAuthInfo = 'auth/SetAuthInfo',
}

export type AuthSetUsernameEffect = Effect<AuthEffect.SetUsername, string>;
export type AuthSetPasswordEffect = Effect<AuthEffect.SetPassword, string>;
export type AuthSetAuthInfoEffect = Effect<AuthEffect.SetAuthInfo, AuthenticateUserResponse>;

export type AuthEffects = AuthSetUsernameEffect | AuthSetPasswordEffect | AuthSetAuthInfoEffect;

export type AuthLoginPayload = {
  username: string;
  password: string;
};

export type AuthRefreshTokenPayload = {
  refreshToken: string;
};
