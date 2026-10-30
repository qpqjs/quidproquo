import { createActionRequester } from '../../logic/actions/createActionRequester';
import { Nullable, StorySession } from '../../types';
import { AskResponse } from '../../types/StorySession';
import { EventActionType } from './EventActionType';
import { AnyMatchStoryResult } from './types';

export const askEventGetStorySessionBase = createActionRequester<Nullable<StorySession>>()({
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
): AskResponse<Nullable<StorySession>> {
  return yield* askEventGetStorySessionBase(eventParams, qpqEventRecord, matchStoryResult);
}
