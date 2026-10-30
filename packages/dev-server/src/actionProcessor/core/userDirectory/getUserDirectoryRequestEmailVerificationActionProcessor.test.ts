import { UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { DEV_USER_EMAIL } from '../../../logic/auth/devAuth';
import { signDevJwt } from '../../../logic/auth/devJwt';
import { getUserDirectoryRequestEmailVerificationActionProcessor } from './getUserDirectoryRequestEmailVerificationActionProcessor';

const getProcessor = async () => {
  const processors = await getUserDirectoryRequestEmailVerificationActionProcessor(buildTestQpqConfig([]), noopDynamicModuleLoader);
  return processors[UserDirectoryActionType.RequestEmailVerification];
};

describe('getUserDirectoryRequestEmailVerificationActionProcessor', () => {
  it('answers a simulated delivery to the email carried by the access token', async () => {
    const process = await getProcessor();
    const accessToken = signDevJwt('test-secret', { sub: 'user-1', email: 'joe@example.com' });

    const [result, error] = await invokeProcessor(process!, { userDirectoryName: 'directory', accessToken });

    expect(error).toBeUndefined();
    expect(result).toEqual({ attributeName: 'email', deliveryMedium: 'EMAIL', destination: 'joe@example.com' });
  });

  it('falls back to the dev user when the token names nobody', async () => {
    const process = await getProcessor();

    const [result] = await invokeProcessor(process!, { userDirectoryName: 'directory', accessToken: signDevJwt('test-secret', {}) });

    expect(result).toEqual({ attributeName: 'email', deliveryMedium: 'EMAIL', destination: DEV_USER_EMAIL });
  });
});
