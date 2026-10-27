import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { EventActionType } from './EventActionType';

export const askEventTransformEventParamsBase = createActionRequester<unknown>()({
  actionType: EventActionType.TransformEventParams,
  getPayload: (eventParams: unknown[]) => ({ eventParams }),
});

// Event shapes are per event source, so the base is untyped and each entry point casts
// to the params its own source produces.
export function* askEventTransformEventParams<T extends Array<unknown>, TRes>(...eventParams: T): AskResponse<TRes> {
  return (yield* askEventTransformEventParamsBase(eventParams)) as TRes;
}
