import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askUserDirectoryRespondToAuthChallenge, AuthenticateUserChallenge, defineUserDirectory, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { respondToAuthChallenge } from '../../../logic/cognito/respondToAuthChallenge';
import { verifySoftwareToken } from '../../../logic/cognito/verifySoftwareToken';
import { getUserDirectoryRespondToAuthChallengeActionProcessor } from './getUserDirectoryRespondToAuthChallengeActionProcessor';

vi.mock('../../../logic/cloudformation/getExportedValue', () => ({ getExportedValue: vi.fn() }));
vi.mock('../../../logic/cognito/respondToAuthChallenge', () => ({ respondToAuthChallenge: vi.fn() }));
vi.mock('../../../logic/cognito/verifySoftwareToken', () => ({ verifySoftwareToken: vi.fn() }));

const cognitoError = (name: string) => Object.assign(new Error(name), { name });

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineUserDirectory('users')]);
  const processors = await getUserDirectoryRespondToAuthChallengeActionProcessor(config, {} as any);
  return processors[UserDirectoryActionType.RespondToAuthChallenge];
};

describe('getUserDirectoryRespondToAuthChallengeActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getExportedValue).mockReset().mockResolvedValue('POOL');
    vi.mocked(respondToAuthChallenge).mockReset();
    vi.mocked(verifySoftwareToken).mockReset();
  });

  it('answers the cognito result', async () => {
    const processor = await resolveProcessor();
    vi.mocked(respondToAuthChallenge).mockResolvedValue({ challenge: 'NONE' } as any);

    const [result, error] = await invokeProcessor(processor!, {
      userDirectoryName: 'users',
      authChallenge: {
        challenge: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED,
        username: 'joe@example.com',
        session: 'sess',
        newPassword: 'N3w-pass',
      } as any,
    });

    expect(error).toBeUndefined();
    expect(result).toEqual({ challenge: 'NONE' });
    expect(respondToAuthChallenge).toHaveBeenCalledWith('POOL', 'POOL', 'eu-west-1', 'joe@example.com', 'sess', 'NEW_PASSWORD_REQUIRED', {
      NEW_PASSWORD: 'N3w-pass',
    });
    expect(verifySoftwareToken).not.toHaveBeenCalled();
  });

  it('maps CodeMismatchException to InvalidCode', async () => {
    const processor = await resolveProcessor();
    vi.mocked(respondToAuthChallenge).mockRejectedValue(cognitoError('CodeMismatchException'));

    const [, error] = await invokeProcessor(processor!, {
      userDirectoryName: 'users',
      authChallenge: {
        challenge: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED,
        username: 'joe@example.com',
        session: 'sess',
        newPassword: 'N3w-pass',
      } as any,
    });

    expect(error?.errorType).toBe(askUserDirectoryRespondToAuthChallenge.errorType.InvalidCode);
  });

  it('maps ExpiredCodeException to ExpiredCode', async () => {
    const processor = await resolveProcessor();
    vi.mocked(respondToAuthChallenge).mockRejectedValue(cognitoError('ExpiredCodeException'));

    const [, error] = await invokeProcessor(processor!, {
      userDirectoryName: 'users',
      authChallenge: {
        challenge: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED,
        username: 'joe@example.com',
        session: 'sess',
        newPassword: 'N3w-pass',
      } as any,
    });

    expect(error?.errorType).toBe(askUserDirectoryRespondToAuthChallenge.errorType.ExpiredCode);
  });

  it('maps InvalidPasswordException to InvalidNewPassword', async () => {
    const processor = await resolveProcessor();
    vi.mocked(respondToAuthChallenge).mockRejectedValue(cognitoError('InvalidPasswordException'));

    const [, error] = await invokeProcessor(processor!, {
      userDirectoryName: 'users',
      authChallenge: {
        challenge: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED,
        username: 'joe@example.com',
        session: 'sess',
        newPassword: 'N3w-pass',
      } as any,
    });

    expect(error?.errorType).toBe(askUserDirectoryRespondToAuthChallenge.errorType.InvalidNewPassword);
  });

  it('maps NotAuthorizedException to Unauthorized', async () => {
    const processor = await resolveProcessor();
    vi.mocked(respondToAuthChallenge).mockRejectedValue(cognitoError('NotAuthorizedException'));

    const [, error] = await invokeProcessor(processor!, {
      userDirectoryName: 'users',
      authChallenge: {
        challenge: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED,
        username: 'joe@example.com',
        session: 'sess',
        newPassword: 'N3w-pass',
      } as any,
    });

    expect(error?.errorType).toBe(askUserDirectoryRespondToAuthChallenge.errorType.Unauthorized);
  });

  it('maps LimitExceededException to LimitExceeded', async () => {
    const processor = await resolveProcessor();
    vi.mocked(respondToAuthChallenge).mockRejectedValue(cognitoError('LimitExceededException'));

    const [, error] = await invokeProcessor(processor!, {
      userDirectoryName: 'users',
      authChallenge: {
        challenge: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED,
        username: 'joe@example.com',
        session: 'sess',
        newPassword: 'N3w-pass',
      } as any,
    });

    expect(error?.errorType).toBe(askUserDirectoryRespondToAuthChallenge.errorType.LimitExceeded);
  });

  it('verifies the TOTP code first for MFA_SETUP and completes the challenge with the refreshed session', async () => {
    const processor = await resolveProcessor();
    vi.mocked(verifySoftwareToken).mockResolvedValue('sess-2');
    vi.mocked(respondToAuthChallenge).mockResolvedValue({ challenge: 'NONE' } as any);

    const [result] = await invokeProcessor(processor!, {
      userDirectoryName: 'users',
      authChallenge: { challenge: AuthenticateUserChallenge.MFA_SETUP, username: 'joe@example.com', session: 'sess', mfaCode: '123456' } as any,
    });

    expect(result).toEqual({ challenge: 'NONE' });
    expect(verifySoftwareToken).toHaveBeenCalledWith('eu-west-1', 'sess', '123456');
    expect(respondToAuthChallenge).toHaveBeenCalledWith('POOL', 'POOL', 'eu-west-1', 'joe@example.com', 'sess-2', 'MFA_SETUP', {});
  });

  it('maps a rejected TOTP enrolment code to InvalidCode', async () => {
    const processor = await resolveProcessor();
    vi.mocked(verifySoftwareToken).mockRejectedValue(cognitoError('EnableSoftwareTokenMFAException'));

    const [, error] = await invokeProcessor(processor!, {
      userDirectoryName: 'users',
      authChallenge: { challenge: AuthenticateUserChallenge.MFA_SETUP, username: 'joe@example.com', session: 'sess', mfaCode: '000000' } as any,
    });

    expect(error?.errorType).toBe(askUserDirectoryRespondToAuthChallenge.errorType.InvalidCode);
  });
});
