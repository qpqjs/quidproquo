import { createActionRequester } from '../../logic/actions/createActionRequester';
import { AskResponse } from '../../types/StorySession';
import { EventActionType } from './EventActionType';
import { AnyMatchStoryResult } from './types';

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
