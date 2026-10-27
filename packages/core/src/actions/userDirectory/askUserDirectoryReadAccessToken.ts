import { createActionRequester } from '../../types';
import { DecodedAccessToken } from '../../types/StorySession';
import { UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectoryReadAccessToken = createActionRequester<DecodedAccessToken>()({
  actionType: UserDirectoryActionType.ReadAccessToken,
  getPayload: (userDirectoryName: string, ignoreExpiration: boolean) => ({ userDirectoryName, ignoreExpiration }),
});
