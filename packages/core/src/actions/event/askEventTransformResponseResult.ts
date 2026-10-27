import { EitherActionResult } from '../../types/Action';
import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { EventActionType } from './EventActionType';

export interface EventTransformResponseResultActionPayload<EventParams extends Array<unknown>, QpqEventRecordResponse> {
  qpqEventRecordResponses: EitherActionResult<QpqEventRecordResponse>[];
  eventParams: EventParams;
}

export const askEventTransformResponseResultBase = createActionRequester<unknown>()({
  actionType: EventActionType.TransformResponseResult,
  getPayload: (qpqEventRecordResponses: EitherActionResult<unknown>[], eventParams: unknown[]) => ({ qpqEventRecordResponses, eventParams }),
});

// Event shapes are per event source, so the base is untyped and each entry point casts
// to the response its own source produces.
export function* askEventTransformResponseResult<EventParams extends Array<unknown>, QpqEventRecordResponse, EventResponse>(
  qpqEventRecordResponses: EitherActionResult<QpqEventRecordResponse>[],
  ...eventParams: EventParams
): AskResponse<EventResponse> {
  return (yield* askEventTransformResponseResultBase(qpqEventRecordResponses, eventParams)) as EventResponse;
}
