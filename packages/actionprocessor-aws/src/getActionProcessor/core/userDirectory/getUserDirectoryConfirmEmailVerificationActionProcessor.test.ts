import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig, UserDirectoryActionType } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { verifyUserEmail } from '../../../logic/cognito/verifyUserEmail';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getUserDirectoryConfirmEmailVerificationActionProcessor } from './getUserDirectoryConfirmEmailVerificationActionProcessor';

vi.mock('../../../logic/cognito/verifyUserEmail', () => ({
  verifyUserEmail: vi.fn(),
}));

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);
  const processors = await getUserDirectoryConfirmEmailVerificationActionProcessor(config, {} as any);
  return processors[UserDirectoryActionType.ConfirmEmailVerification];
};

describe('getUserDirectoryConfirmEmailVerificationActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(verifyUserEmail).mockReset();
  });

  it('verifies the email with the confirmation code', async () => {
    const processor = await resolveProcessor();

    const result = await invokeProcessor(processor, { code: '123', accessToken: 'tok' });

    expect(result).toEqual([undefined]);
    expect(verifyUserEmail).toHaveBeenCalledWith('eu-west-1', 'tok', '123');
  });
});
