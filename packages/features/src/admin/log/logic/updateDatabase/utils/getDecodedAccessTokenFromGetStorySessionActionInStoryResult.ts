import { ActionHistory, DecodedAccessToken, EventActionType, StoryResult, StorySession } from '@qpqjs/core';

export const getDecodedAccessTokenFromGetStorySessionActionInStoryResult = (storyResult: StoryResult<any>): DecodedAccessToken | undefined => {
  const actionPayload: ActionHistory<unknown, StorySession | undefined> | undefined = storyResult.history.find(
    (h) => h.act.type === EventActionType.GetStorySession,
  );

  return actionPayload?.res?.decodedAccessToken;
};
