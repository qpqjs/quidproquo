import { createActionRequester } from '../../logic/actions/createActionRequester';
import { QpqContextIdentifier } from '../../types';
import { Action } from '../../types/Action';
import { AskResponse } from '../../types/StorySession';
import { ContextActionType } from './ContextActionType';

export type ContextReadActionPayload<T> = {
  contextIdentifier: QpqContextIdentifier<T>;
};

export type ContextReadAction<T> = {
  type: ContextActionType.Read;
  payload: ContextReadActionPayload<T>;
} & Action<ContextReadActionPayload<T>>;

export const askContextReadBase = createActionRequester<unknown>()({
  actionType: ContextActionType.Read,
  getPayload: (contextIdentifier: QpqContextIdentifier<unknown>) => ({ contextIdentifier }),
});

// The context's value type travels on the identifier, so the base returns unknown and
// this story casts it back to what the identifier declared.
export function* askContextRead<T>(contextIdentifier: QpqContextIdentifier<T>): AskResponse<T> {
  return (yield* askContextReadBase(contextIdentifier as QpqContextIdentifier<unknown>)) as T;
}
