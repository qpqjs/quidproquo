import { createActionRequester } from '../../logic/actions';
import { DecodedAccessToken } from '../../types/StorySession';
import { UserDirectoryActionType } from './UserDirectoryActionType';

/** The identity to make the session's user. */
export type UserDirectorySetDecodedAccessTokenActionPayload = {
  decodedAccessToken: DecodedAccessToken;
};

/**
 * Makes an identity the caller has already verified the session's user, for a principal no user directory can decode
 * (one a service authenticates itself). Nothing is checked here: the caller vouches for every field, `wasValid` included.
 */
export const askUserDirectorySetDecodedAccessToken = createActionRequester<void>()({
  actionType: UserDirectoryActionType.SetDecodedAccessToken,
  getPayload: (decodedAccessToken: DecodedAccessToken): UserDirectorySetDecodedAccessTokenActionPayload => ({ decodedAccessToken }),
});
