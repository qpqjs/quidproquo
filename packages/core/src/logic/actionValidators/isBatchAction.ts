import { askBatchBase, SystemActionType } from '../../actions';
import { Action, ActionOf } from '../../types';

export function isBatchAction(action: Action<any>): action is ActionOf<typeof askBatchBase> {
  return action.type === SystemActionType.Batch;
}
