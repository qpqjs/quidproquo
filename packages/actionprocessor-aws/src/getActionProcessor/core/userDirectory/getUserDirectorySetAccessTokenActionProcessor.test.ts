import { buildTestQpqConfig, DecodedAccessToken, ErrorTypeEnum, UserDirectoryActionType } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { decodeAccessToken } from '../../../logic/cognito';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getUserDirectorySetAccessTokenActionProcessor } from './getUserDirectorySetAccessTokenActionProcessor';

vi.mock('../../../logic/cognito', () => ({
  decodeAccessToken: vi.fn(),
}));

const decodedToken: DecodedAccessToken = {
  userId: 'user-1',
  username: 'joe@example.com',
  exp: 4102444800,
  wasValid: true,
  userDirectory: 'users',
};

const resolveProcessor = async () => {
  const processors = await getUserDirectorySetAccessTokenActionProcessor(buildTestQpqConfig([]), {} as any);
  return processors[UserDirectoryActionType.SetAccessToken];
};

describe('getUserDirectorySetAccessTokenActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(decodeAccessToken).mockReset();
  });

  it('stamps the decoded token onto the session and returns it', async () => {
    vi.mocked(decodeAccessToken).mockResolvedValue(decodedToken);
    const updateSession = vi.fn();
    const processor = await resolveProcessor();

    const [returned, error] = await invokeProcessor(processor, { userDirectoryName: 'users', accessToken: 'tok' }, { updateSession });

    expect(error).toBeUndefined();
    expect(returned).toEqual(decodedToken);
    expect(updateSession).toHaveBeenCalledWith({ decodedAccessToken: decodedToken, accessToken: 'tok' });
  });

  it('returns Unauthorized and leaves the session untouched when the token cannot be decoded', async () => {
    vi.mocked(decodeAccessToken).mockRejectedValue(new Error('Unable to decode access token'));
    const updateSession = vi.fn();
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor, { userDirectoryName: 'users', accessToken: 'forged' }, { updateSession });

    expect(error?.errorType).toBe(ErrorTypeEnum.Unauthorized);
    expect(updateSession).not.toHaveBeenCalled();
  });
});
