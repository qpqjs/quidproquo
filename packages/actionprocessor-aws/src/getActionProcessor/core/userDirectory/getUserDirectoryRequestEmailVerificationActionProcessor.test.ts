import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import {
  askUserDirectoryRequestEmailVerification,
  buildTestQpqConfig,
  createActionProcessor,
  ProcessorFor,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestEmailVerificationCode } from '../../../logic/cognito/requestEmailVerificationCode';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getUserDirectoryRequestEmailVerificationActionProcessor } from './getUserDirectoryRequestEmailVerificationActionProcessor';

vi.mock('../../../logic/cognito/requestEmailVerificationCode', () => ({
  requestEmailVerificationCode: vi.fn(),
}));

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);
  const processors = await getUserDirectoryRequestEmailVerificationActionProcessor(config, {} as any);
  return processors[UserDirectoryActionType.RequestEmailVerification];
};

// Builds an error shaped like an AWS SDK failure, whose `name` drives the
// processor's actionResultErrorFromCaughtError mapping.
const buildAwsError = (name: string): Error => {
  const error = new Error(name);
  error.name = name;
  return error;
};

describe('getUserDirectoryRequestEmailVerificationActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(requestEmailVerificationCode).mockReset();
  });

  it('requests a code for the access token and returns the delivery details', async () => {
    vi.mocked(requestEmailVerificationCode).mockResolvedValue({
      attributeName: 'email',
      deliveryMedium: 'EMAIL',
      destination: 'a***@b.com',
    });
    const processor = await resolveProcessor();

    const [details, error] = await invokeProcessor(processor, { userDirectoryName: 'users', accessToken: 'tok' });

    expect(error).toBeUndefined();
    expect(details).toEqual({ attributeName: 'email', deliveryMedium: 'EMAIL', destination: 'a***@b.com' });
    expect(requestEmailVerificationCode).toHaveBeenCalledWith('eu-west-1', 'tok');
  });

  it('maps NotAuthorizedException to the Unauthorized error', async () => {
    vi.mocked(requestEmailVerificationCode).mockRejectedValue(buildAwsError('NotAuthorizedException'));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor, { userDirectoryName: 'users', accessToken: 'bad' });

    expect(error?.errorType).toBe(askUserDirectoryRequestEmailVerification.errorType.Unauthorized);
  });

  it('maps CodeDeliveryFailureException to the CodeDeliveryFailed error', async () => {
    vi.mocked(requestEmailVerificationCode).mockRejectedValue(buildAwsError('CodeDeliveryFailureException'));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor, { userDirectoryName: 'users', accessToken: 'tok' });

    expect(error?.errorType).toBe(askUserDirectoryRequestEmailVerification.errorType.CodeDeliveryFailed);
  });
});
