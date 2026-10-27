import { Action, AuthenticateUserChallenge, ConfigActionType, ErrorTypeEnum, runStory, StoryError, UserDirectoryActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { HTTPEvent } from '../../../../types';
import {
  associateSoftwareToken,
  changePassword,
  confirmForgotPassword,
  forgotPassword,
  login,
  refreshToken,
  respondToAuthChallenge,
} from './authController';

const jsonEvent = (body: unknown, headers: HTTPEvent['headers'] = {}): HTTPEvent =>
  ({
    path: '/',
    query: {},
    body: JSON.stringify(body),
    headers,
    method: 'POST',
    correlation: 'corr-1',
    sourceIp: '127.0.0.1',
    isBase64Encoded: false,
  }) as HTTPEvent;

// Runs a story that is expected to die with a typed StoryError and asserts its
// errorType, so each failure-path test reads as one line.
const expectStoryErrorType = (run: () => unknown, errorType: ErrorTypeEnum) => {
  try {
    run();
    throw new Error('expected a StoryError');
  } catch (e) {
    expect(e).toBeInstanceOf(StoryError);
    expect((e as StoryError).errorType).toBe(errorType);
  }
};

describe('login', () => {
  it('logs in and returns the auth response as json', () => {
    const authResponse = { challenge: AuthenticateUserChallenge.NONE };

    const response = runStory(login(jsonEvent({ username: 'a@b.com', password: 'pw' })), {
      [ConfigActionType.GetGlobal]: 'my-directory',
      [UserDirectoryActionType.AuthenticateUser]: authResponse,
    });

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body!)).toEqual(authResponse);
  });

  it('rejects a payload with a missing or empty field as Invalid', () => {
    expectStoryErrorType(() => runStory(login(jsonEvent({ username: 'a@b.com' }))), ErrorTypeEnum.Invalid);
    expectStoryErrorType(() => runStory(login(jsonEvent({ username: 'a@b.com', password: '' }))), ErrorTypeEnum.Invalid);
  });
});

describe('refreshToken', () => {
  it('refreshes the session and returns the response as json', () => {
    const authResponse = { challenge: AuthenticateUserChallenge.NONE };

    const response = runStory(refreshToken(jsonEvent({ refreshToken: 'tok' })), {
      [ConfigActionType.GetGlobal]: 'my-directory',
      [UserDirectoryActionType.RefreshToken]: authResponse,
    });

    expect(JSON.parse(response.body!)).toEqual(authResponse);
  });

  it('rejects a payload without a refresh token as Invalid', () => {
    expectStoryErrorType(() => runStory(refreshToken(jsonEvent({}))), ErrorTypeEnum.Invalid);
  });
});

describe('associateSoftwareToken', () => {
  it('associates a software token and returns the result as json', () => {
    const tokenResult = { secretCode: 'abc' };

    const response = runStory(associateSoftwareToken(jsonEvent({ session: 's' })), {
      [ConfigActionType.GetGlobal]: 'my-directory',
      [UserDirectoryActionType.AssociateSoftwareToken]: tokenResult,
    });

    expect(JSON.parse(response.body!)).toEqual(tokenResult);
  });

  it('rejects a payload without a session as Invalid', () => {
    expectStoryErrorType(() => runStory(associateSoftwareToken(jsonEvent({}))), ErrorTypeEnum.Invalid);
  });
});

describe('forgotPassword', () => {
  it('starts a reset and returns delivery details as json', () => {
    const deliveryDetails = { attributeName: 'email', deliveryMedium: 'EMAIL', destination: 'a***@b.com' };

    const response = runStory(forgotPassword(jsonEvent({ username: 'a@b.com' })), {
      [ConfigActionType.GetGlobal]: 'my-directory',
      [UserDirectoryActionType.ForgotPassword]: deliveryDetails,
    });

    expect(JSON.parse(response.body!)).toEqual(deliveryDetails);
  });

  it('rejects a payload without a username as Invalid', () => {
    expectStoryErrorType(() => runStory(forgotPassword(jsonEvent({}))), ErrorTypeEnum.Invalid);
  });
});

describe('confirmForgotPassword', () => {
  it('confirms the reset and returns the response as json', () => {
    const authResponse = { challenge: AuthenticateUserChallenge.NONE };

    const response = runStory(confirmForgotPassword(jsonEvent({ username: 'a@b.com', code: 'c', password: 'pw' })), {
      [ConfigActionType.GetGlobal]: 'my-directory',
      [UserDirectoryActionType.ConfirmForgotPassword]: authResponse,
    });

    expect(JSON.parse(response.body!)).toEqual(authResponse);
  });

  it('rejects a payload without a code as Invalid', () => {
    expectStoryErrorType(() => runStory(confirmForgotPassword(jsonEvent({ username: 'a@b.com', password: 'pw' }))), ErrorTypeEnum.Invalid);
  });
});

describe('changePassword', () => {
  it('reads the access token from the authorization header and returns success', () => {
    let captured: Action<any> | undefined;

    const response = runStory(changePassword(jsonEvent({ oldPassword: 'old', newPassword: 'new' }, { authorization: 'Bearer access-tok' })), {
      [UserDirectoryActionType.ChangePassword]: (action: Action<any>) => {
        captured = action;
        return undefined;
      },
    });

    expect(captured?.payload).toEqual({ oldPassword: 'old', newPassword: 'new', accessToken: 'access-tok' });
    expect(JSON.parse(response.body!)).toEqual({ success: true });
  });

  it('rejects a payload without a new password as Invalid', () => {
    expectStoryErrorType(
      () => runStory(changePassword(jsonEvent({ oldPassword: 'old' }, { authorization: 'Bearer access-tok' }))),
      ErrorTypeEnum.Invalid,
    );
  });

  it('rejects a request without an access token as Unauthorized', () => {
    expectStoryErrorType(() => runStory(changePassword(jsonEvent({ oldPassword: 'old', newPassword: 'new' }))), ErrorTypeEnum.Unauthorized);
  });
});

describe('respondToAuthChallenge', () => {
  it.each([
    [
      AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED,
      { email: 'a@b.com', session: 's', challenge: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED, newPassword: 'pw' },
      { challenge: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED, username: 'a@b.com', session: 's', newPassword: 'pw' },
    ],
    [
      AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA,
      { email: 'a@b.com', session: 's', challenge: AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA, mfaCode: '123' },
      { challenge: AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA, username: 'a@b.com', session: 's', mfaCode: '123' },
    ],
    [
      AuthenticateUserChallenge.MFA_SETUP,
      { email: 'a@b.com', session: 's', challenge: AuthenticateUserChallenge.MFA_SETUP, mfaCode: '123' },
      { challenge: AuthenticateUserChallenge.MFA_SETUP, username: 'a@b.com', session: 's', mfaCode: '123' },
    ],
  ])(
    'maps the %s wire payload onto the core auth challenge',
    (_challenge: AuthenticateUserChallenge, payload: unknown, expectedChallenge: unknown) => {
      let captured: Action<any> | undefined;

      runStory(respondToAuthChallenge(jsonEvent(payload)), {
        [ConfigActionType.GetGlobal]: 'my-directory',
        [UserDirectoryActionType.RespondToAuthChallenge]: (action: Action<any>) => {
          captured = action;
          return { challenge: AuthenticateUserChallenge.NONE };
        },
      });

      expect(captured?.payload.authChallenge).toEqual(expectedChallenge);
    },
  );

  it('rejects an unsupported challenge type as BadRequest', () => {
    expectStoryErrorType(
      () => runStory(respondToAuthChallenge(jsonEvent({ email: 'a@b.com', session: 's', challenge: AuthenticateUserChallenge.NONE }))),
      ErrorTypeEnum.BadRequest,
    );
  });

  it('rejects a known challenge type missing its credential field as BadRequest', () => {
    expectStoryErrorType(
      () =>
        runStory(respondToAuthChallenge(jsonEvent({ email: 'a@b.com', session: 's', challenge: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED }))),
      ErrorTypeEnum.BadRequest,
    );
  });

  it('rejects a payload without a session as Invalid', () => {
    expectStoryErrorType(
      () => runStory(respondToAuthChallenge(jsonEvent({ email: 'a@b.com', challenge: AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA, mfaCode: '1' }))),
      ErrorTypeEnum.Invalid,
    );
  });
});
