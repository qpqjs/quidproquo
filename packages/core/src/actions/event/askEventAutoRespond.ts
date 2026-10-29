import { createActionRequester } from '../../logic/actions/createActionRequester';
import { Nullable } from '../../types/Nullable';
import { AskResponse } from '../../types/StorySession';
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
): AskResponse<Nullable<QpqEventRecordResponse>> {
  return (yield* askEventAutoRespondBase(qpqEventRecord, matchResult)) as Nullable<QpqEventRecordResponse>;
}
