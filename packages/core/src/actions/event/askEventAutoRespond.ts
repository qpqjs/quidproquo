import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { AnyMatchStoryResult, EventActionType } from './EventActionType';

export const askEventAutoRespondBase = createActionRequester<unknown>()({
  actionType: EventActionType.AutoRespond,
  getPayload: (qpqEventRecord: unknown, matchResult: AnyMatchStoryResult) => ({ qpqEventRecord, matchResult }),
});

// Event shapes are per event source, so the base is untyped and each entry point casts
// to the record types its own source produces.
export function* askEventAutoRespond<QpqEventRecord, MSR extends AnyMatchStoryResult, QpqEventRecordResponse>(
  qpqEventRecord: QpqEventRecord,
  matchResult: MSR,
): AskResponse<QpqEventRecordResponse | null> {
  return (yield* askEventAutoRespondBase(qpqEventRecord, matchResult)) as QpqEventRecordResponse | null;
}
