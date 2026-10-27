import { createActionRequester } from '../../types';
import { DecodedAccessToken } from '../../types/StorySession';
import { UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectoryDecodeAccessToken = createActionRequester<DecodedAccessToken>()({
  actionType: UserDirectoryActionType.DecodeAccessToken,
  errorTypes: [
    'Unauthorized', // the access token is missing, malformed, expired, or its signature could not be verified
  ],
  getPayload: (userDirectoryName: string, ignoreExpiration: boolean, accessToken: string) => ({ userDirectoryName, accessToken, ignoreExpiration }),
});
