import { ActionHistory, DecodedAccessToken, StoryResult, UserDirectoryActionType, UserDirectorySetAccessTokenActionPayload } from '@qpqjs/core';

export const getDecodedAccessTokenFromSetAccessTokenActionInStoryResult = (storyResult: StoryResult<any>): DecodedAccessToken | undefined => {
  const actionPayload: ActionHistory<UserDirectorySetAccessTokenActionPayload, DecodedAccessToken> | undefined = storyResult.history.find(
    (h) => h.act.type === UserDirectoryActionType.SetAccessToken,
  );

  if (!actionPayload) {
    return undefined;
  }

  return actionPayload.res;
};
