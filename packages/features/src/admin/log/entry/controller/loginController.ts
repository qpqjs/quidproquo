import { AskResponse, AuthenticateUserChallenge } from 'quidproquo-core';
// TODO: Fix this import (name it up the chain)
import { qpqWebServerUtils } from 'quidproquo-webserver';
import { HTTPEvent, HTTPEventResponse } from 'quidproquo-webserver';

import { authLogic } from '../../logic';

export type LoginPayload = {
  username: string;
  password: string;
};

export type RefreshPayload = {
  refreshToken: string;
};

export type ChallengePayload = {
  email: string;
  session: string;
  challenge: string;
};

export type NewPasswordChallengePayload = ChallengePayload & {
  newPassword: string;
};

export type RefreshTokenPayload = {
  refreshToken: string;
};

export function* login(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const { username, password } = yield* qpqWebServerUtils.askFromJsonEventRequest<LoginPayload>(event);

  const authResponse = yield* authLogic.askLogin(username, password);

  return qpqWebServerUtils.toJsonEventResponse(authResponse);
}

export function* refreshToken(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const { refreshToken } = yield* qpqWebServerUtils.askFromJsonEventRequest<RefreshPayload>(event);

  const refreshResponse = yield* authLogic.askRefreshToken(refreshToken);

  return qpqWebServerUtils.toJsonEventResponse(refreshResponse);
}

export function* respondToAuthChallenge(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const authChallenge = yield* qpqWebServerUtils.askFromJsonEventRequest<NewPasswordChallengePayload>(event);

  // TODO: Make this more generic ~ Currently we only support one challenge
  const response = yield* authLogic.askRespondToAuthChallenge(
    authChallenge.email,
    AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED,
    authChallenge.session,
    authChallenge.newPassword,
  );

  return qpqWebServerUtils.toJsonEventResponse(response);
}
