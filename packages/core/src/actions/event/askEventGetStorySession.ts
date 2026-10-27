import { StorySession } from '../../types';
import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { AnyMatchStoryResult, EventActionType } from './EventActionType';

export const askEventGetStorySessionBase = createActionRequester<StorySession | undefined>()({
  actionType: EventActionType.GetStorySession,
  getPayload: (eventParams: unknown[], qpqEventRecord: unknown, matchStoryResult: AnyMatchStoryResult) => ({
    eventParams,
    qpqEventRecord,
    matchStoryResult,
  }),
});

export function* askEventGetStorySession<EventParams extends Array<unknown>, QpqEventRecord, MSR extends AnyMatchStoryResult>(
  eventParams: EventParams,
  qpqEventRecord: QpqEventRecord,
  matchStoryResult: MSR,
): AskResponse<StorySession | undefined> {
  return yield* askEventGetStorySessionBase(eventParams, qpqEventRecord, matchStoryResult);
}
