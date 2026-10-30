import { UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { DEV_USER_EMAIL } from '../../../logic/auth/devAuth';
import { getUserDirectoryForgotPasswordActionProcessor } from './getUserDirectoryForgotPasswordActionProcessor';

const getProcessor = async () => {
  const processors = await getUserDirectoryForgotPasswordActionProcessor(buildTestQpqConfig([]), noopDynamicModuleLoader);
  return processors[UserDirectoryActionType.ForgotPassword];
};

describe('getUserDirectoryForgotPasswordActionProcessor', () => {
  it('answers a simulated email delivery to the given login; nothing is sent', async () => {
    const process = await getProcessor();

    const [result, error] = await invokeProcessor(process!, { userDirectoryName: 'directory', username: 'joe@example.com' });

    expect(error).toBeUndefined();
    expect(result).toEqual({ attributeName: 'email', deliveryMedium: 'EMAIL', destination: 'joe@example.com' });
  });

  it('falls back to the dev user when no login is given', async () => {
    const process = await getProcessor();

    const [result] = await invokeProcessor(process!, { userDirectoryName: 'directory', username: '' });

    expect(result).toEqual({ attributeName: 'email', deliveryMedium: 'EMAIL', destination: DEV_USER_EMAIL });
  });
});
