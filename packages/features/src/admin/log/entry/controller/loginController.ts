import { AskResponse, AuthenticateUserChallenge } from '@qpqjs/core';
import { qpqWebServerUtils } from '@qpqjs/webserver';
import { HTTPEvent, HTTPEventResponse } from '@qpqjs/webserver';

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
  const { username, password } = yield* qpqWebServerUtils.askFromValidJsonEventRequest<LoginPayload>(
    event,
    qpqWebServerUtils.requireStringFields('username', 'password'),
  );

  const authResponse = yield* authLogic.askLogin(username, password);

  return qpqWebServerUtils.toJsonEventResponse(authResponse);
}

export function* refreshToken(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const { refreshToken } = yield* qpqWebServerUtils.askFromValidJsonEventRequest<RefreshPayload>(
    event,
    qpqWebServerUtils.requireStringFields('refreshToken'),
  );

  const refreshResponse = yield* authLogic.askRefreshToken(refreshToken);

  return qpqWebServerUtils.toJsonEventResponse(refreshResponse);
}

export function* respondToAuthChallenge(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const authChallenge = yield* qpqWebServerUtils.askFromValidJsonEventRequest<NewPasswordChallengePayload>(
    event,
    qpqWebServerUtils.requireStringFields('email', 'session', 'challenge', 'newPassword'),
  );

  // TODO: @joe-coady: Make this more generic ~ Currently we only support one challenge
  const response = yield* authLogic.askRespondToAuthChallenge(
    authChallenge.email,
    AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED,
    authChallenge.session,
    authChallenge.newPassword,
  );

  return qpqWebServerUtils.toJsonEventResponse(response);
}
