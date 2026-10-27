import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { EventActionType } from './EventActionType';

export const askEventTransformEventRecordResponseBase = createActionRequester<unknown>()({
  actionType: EventActionType.TransformEventRecordResponse,
  getPayload: (eventRecord: unknown) => ({ eventRecord }),
});

// Event shapes are per event source, so the base is untyped and each entry point casts
// to the record types its own source produces.
export function* askEventTransformEventRecordResponse<EventRecord, QpqEventRecord>(eventRecord: EventRecord): AskResponse<QpqEventRecord> {
  return (yield* askEventTransformEventRecordResponseBase(eventRecord)) as QpqEventRecord;
}
