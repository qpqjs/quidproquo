import { QPQError } from '../../types';
import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { EventActionType } from './EventActionType';

export const askEventResolveCaughtErrorBase = createActionRequester<unknown>()({
  actionType: EventActionType.ResolveCaughtError,
  getPayload: (error: QPQError) => ({ error }),
});

// Event shapes are per event source, so the base is untyped and each entry point casts
// to the params its own source produces.
export function* askEventResolveCaughtError<TransformedEventParams>(error: QPQError): AskResponse<TransformedEventParams> {
  return (yield* askEventResolveCaughtErrorBase(error)) as TransformedEventParams;
}
