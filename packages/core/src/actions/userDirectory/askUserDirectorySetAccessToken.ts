import { createActionRequester } from '../../types';
import { DecodedAccessToken } from '../../types/StorySession';
import { UserDirectoryActionType } from './UserDirectoryActionType';

export type UserDirectorySetAccessTokenActionPayload = {
  accessToken: string;
  userDirectoryName: string;
};

export const askUserDirectorySetAccessToken = createActionRequester<DecodedAccessToken>()({
  actionType: UserDirectoryActionType.SetAccessToken,
  getPayload: (userDirectoryName: string, accessToken: string) => ({ accessToken, userDirectoryName }),
});
