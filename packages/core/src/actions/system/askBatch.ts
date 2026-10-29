import { createActionRequester } from '../../logic/actions/createActionRequester';
import { Action } from '../../types/Action';
import { AskResponse } from '../../types/StorySession';
import { SystemActionType } from './SystemActionType';

export type SystemBatchActionPayload = {
  actions: Action<any>[];
};

export const askBatchBase = createActionRequester<any[]>()({
  actionType: SystemActionType.Batch,
  getPayload: (actions: Action<any>[]): SystemBatchActionPayload => ({ actions }),
});

export function* askBatch<TReturn extends Array<any> = any[]>(actions: Action<any>[]): AskResponse<TReturn> {
  // Nothing to batch, don't pollute the story log with a no-op Batch action
  if (actions.length === 0) {
    return [] as unknown as TReturn;
  }

  // If we only have one action, just execute it directly
  // No need to batch it
  const only = actions[0];
  if (actions.length === 1 && only) {
    return [yield only] as TReturn;
  }

  // Otherwise, batch the actions
  return (yield* askBatchBase(actions)) as TReturn;
}
