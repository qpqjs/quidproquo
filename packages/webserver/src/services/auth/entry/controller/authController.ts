import { AnyAuthChallenge, askCatch, AskResponse, askThrowError, AuthenticateUserChallenge, ErrorTypeEnum } from 'quidproquo-core';

// TODO: Fix this import (name it up the chain)
import { qpqWebServerUtils } from '../../../../index';
import { HTTPEvent, HTTPEventResponse } from '../../../../types';
import { authLogic } from '../../logic';
import {
  AnyChallengePayload,
  AssociateSoftwareTokenPayload,
  ChallengePayload,
  ChangePasswordPayload,
  ConfirmForgotPasswordPayload,
  ForgotPasswordPayload,
  isMfaChallengePayload,
  isMfaSetupChallengePayload,
  isNewPasswordChallengePayload,
  LoginPayload,
  RefreshPayload,
} from '../../types';

// Field-presence validator for askFromValidJsonEventRequest. The payload types
// are just casts over whatever json the client sent, so each handler checks its
// required fields are real non-empty strings before anything touches the user
// directory. A miss comes back as a 422 Invalid instead of a downstream error.
const requireStringFields =
  <T>(...fields: string[]) =>
  (data: unknown): T => {
    const record = (data ?? {}) as Record<string, unknown>;
    const missing = fields.filter((field) => typeof record[field] !== 'string' || record[field] === '');

    if (missing.length > 0) {
      throw new Error(`Missing or invalid fields: ${missing.join(', ')}`);
    }

    return data as T;
  };

// Maps the wire payload (discriminated by `challenge`) onto the core auth
// challenge shape. The type guards narrow `payload`, so no manual casts are
// needed. Add a branch here as new challenge types are supported. An unknown
// or malformed challenge is a client error, so it surfaces as a 400.
function* askChallengePayloadToAuthChallenge(payload: AnyChallengePayload): AskResponse<AnyAuthChallenge> {
  if (isNewPasswordChallengePayload(payload)) {
    return {
      challenge: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED,
      username: payload.email,
      session: payload.session,
      newPassword: payload.newPassword,
    };
  }

  if (isMfaChallengePayload(payload)) {
    return {
      challenge: AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA,
      username: payload.email,
      session: payload.session,
      mfaCode: payload.mfaCode,
    };
  }

  if (isMfaSetupChallengePayload(payload)) {
    return {
      challenge: AuthenticateUserChallenge.MFA_SETUP,
      username: payload.email,
      session: payload.session,
      mfaCode: payload.mfaCode,
    };
  }

  return yield* askThrowError(ErrorTypeEnum.BadRequest, `Unsupported or malformed auth challenge: ${(payload as ChallengePayload).challenge}`);
}

export function* login(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const { username, password } = yield* qpqWebServerUtils.askFromValidJsonEventRequest<LoginPayload>(
    event,
    requireStringFields('username', 'password'),
  );

  const authResponse = yield* authLogic.askLogin(username, password);

  return qpqWebServerUtils.toJsonEventResponse(authResponse);
}

export function* refreshToken(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const { refreshToken } = yield* qpqWebServerUtils.askFromValidJsonEventRequest<RefreshPayload>(event, requireStringFields('refreshToken'));

  const refreshResponse = yield* authLogic.askRefreshToken(refreshToken);

  return qpqWebServerUtils.toJsonEventResponse(refreshResponse);
}

export function* logout(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  // "Log out this device": revoke ONLY the caller's own refresh token (Cognito RevokeToken),
  // leaving the user's other sessions signed in. The client sends its refresh token in the
  // body. Best-effort — logout must always succeed for the client (it clears local state
  // regardless), so an already-revoked/invalid token is swallowed rather than 4xx'd. Public
  // route: possessing the refresh token is the authorization (you can only revoke your own).
  const { refreshToken } = yield* qpqWebServerUtils.askFromValidJsonEventRequest<RefreshPayload>(event, requireStringFields('refreshToken'));

  yield* askCatch(authLogic.askRevokeSession(refreshToken));

  return qpqWebServerUtils.toJsonEventResponse({ success: true });
}

export function* logoutEverywhere(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  // "Log out everywhere": revoke EVERY refresh token for the user (Cognito GlobalSignOut),
  // for a user-settings "sign out of all devices" action. Authorized by the access token in
  // the header (GlobalSignOut validates it at Cognito). Best-effort / always 200, same as
  // above — swallow an invalid/expired token rather than failing the client's logout.
  const accessToken = qpqWebServerUtils.getAccessTokenFromHeaders(event.headers);

  if (accessToken) {
    yield* askCatch(authLogic.askSignOut(accessToken));
  }

  return qpqWebServerUtils.toJsonEventResponse({ success: true });
}

export function* respondToAuthChallenge(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const payload = yield* qpqWebServerUtils.askFromValidJsonEventRequest<AnyChallengePayload>(
    event,
    requireStringFields('email', 'session', 'challenge'),
  );

  const authChallenge = yield* askChallengePayloadToAuthChallenge(payload);

  const response = yield* authLogic.askRespondToAuthChallenge(authChallenge);

  return qpqWebServerUtils.toJsonEventResponse(response);
}

export function* associateSoftwareToken(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const { session } = yield* qpqWebServerUtils.askFromValidJsonEventRequest<AssociateSoftwareTokenPayload>(event, requireStringFields('session'));

  const response = yield* authLogic.askAssociateSoftwareToken(session);

  return qpqWebServerUtils.toJsonEventResponse(response);
}

export function* forgotPassword(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const { username } = yield* qpqWebServerUtils.askFromValidJsonEventRequest<ForgotPasswordPayload>(event, requireStringFields('username'));

  const deliveryDetails = yield* authLogic.askForgotPassword(username);

  return qpqWebServerUtils.toJsonEventResponse(deliveryDetails);
}

export function* confirmForgotPassword(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const { username, code, password } = yield* qpqWebServerUtils.askFromValidJsonEventRequest<ConfirmForgotPasswordPayload>(
    event,
    requireStringFields('username', 'code', 'password'),
  );

  const response = yield* authLogic.askConfirmForgotPassword(username, code, password);

  return qpqWebServerUtils.toJsonEventResponse(response);
}

export function* changePassword(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const { oldPassword, newPassword } = yield* qpqWebServerUtils.askFromValidJsonEventRequest<ChangePasswordPayload>(
    event,
    requireStringFields('oldPassword', 'newPassword'),
  );

  // The route is authenticated, so the access token should always be present.
  // Guard anyway so a misconfigured route fails as a 401, not a directory error.
  const accessToken = qpqWebServerUtils.getAccessTokenFromHeaders(event.headers);
  if (!accessToken) {
    return yield* askThrowError(ErrorTypeEnum.Unauthorized, 'Missing access token.');
  }

  yield* authLogic.askChangePassword(oldPassword, newPassword, accessToken);

  return qpqWebServerUtils.toJsonEventResponse({ success: true });
}
