import { DecodedAccessToken, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { getUserDirectorySetDecodedAccessTokenActionProcessor } from './getUserDirectorySetDecodedAccessTokenActionProcessor';

const decodedAccessToken: DecodedAccessToken = {
  userId: 'user-1',
  username: 'Ada',
  exp: 4102444800,
  userDirectory: '',
  wasValid: true,
};

describe('getUserDirectorySetDecodedAccessTokenActionProcessor', () => {
  it('makes the identity the session user and leaves the raw access token alone', async () => {
    const updateSession = vi.fn();
    const processors = await getUserDirectorySetDecodedAccessTokenActionProcessor(buildTestQpqConfig(), async () => null);
    const processor = processors[UserDirectoryActionType.SetDecodedAccessToken]!;

    const [returned, error] = await invokeProcessor(processor, { decodedAccessToken }, { updateSession });

    expect(error).toBeUndefined();
    expect(returned).toBeUndefined();
    expect(updateSession).toHaveBeenCalledWith({ decodedAccessToken });
  });
});
