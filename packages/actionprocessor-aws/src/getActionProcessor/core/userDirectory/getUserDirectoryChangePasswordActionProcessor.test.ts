import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig, UserDirectoryActionType } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { changePassword } from '../../../logic/cognito/changePassword';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getUserDirectoryChangePasswordActionProcessor } from './getUserDirectoryChangePasswordActionProcessor';

vi.mock('../../../logic/cognito/changePassword', () => ({
  changePassword: vi.fn(),
}));

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);
  const processors = await getUserDirectoryChangePasswordActionProcessor(config, {} as any);
  return processors[UserDirectoryActionType.ChangePassword];
};

describe('getUserDirectoryChangePasswordActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(changePassword).mockReset();
  });

  it('changes the password using the access token', async () => {
    const processor = await resolveProcessor();

    const result = await invokeProcessor(processor, { oldPassword: 'old', newPassword: 'new', accessToken: 'tok' });

    expect(result).toEqual([undefined]);
    expect(changePassword).toHaveBeenCalledWith('tok', 'old', 'new', 'eu-west-1');
  });
});
