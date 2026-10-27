import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { AnyMatchStoryResult, EventActionType } from './EventActionType';

export const askEventMatchStoryBase = createActionRequester<AnyMatchStoryResult>()({
  actionType: EventActionType.MatchStory,
  getPayload: (qpqEventRecord: unknown, eventParams: unknown[]) => ({ qpqEventRecord, eventParams }),
});

// Event shapes are per event source, so the base is untyped and each entry point casts
// to the match result its own source produces.
export function* askEventMatchStory<QpqEventRecord, MSR extends AnyMatchStoryResult, EventParams extends Array<unknown>>(
  qpqEventRecord: QpqEventRecord,
  eventParams: EventParams,
): AskResponse<MSR> {
  return (yield* askEventMatchStoryBase(qpqEventRecord, eventParams)) as MSR;
}
