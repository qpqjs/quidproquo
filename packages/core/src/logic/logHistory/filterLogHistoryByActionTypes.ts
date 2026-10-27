import { Action, ActionHistory, ActionProcessorResult, EitherActionResult } from '../../types';
import { actionResult, actionResultError, isErroredActionResult, resolveActionResult } from '../actionLogic';
import { isBatchAction } from '../actionValidators';

// Rebuild the ActionProcessorResult a nested action would have produced on its own,
// so a flattened entry only carries its own result and not every sibling's.
function getNestedActionResult(nestedAction: Action<any>, nestedValue: any): ActionProcessorResult<any> {
  // Batched actions flagged returnErrors come back wrapped as an EitherActionResult.
  if (nestedAction.returnErrors) {
    const either = nestedValue as EitherActionResult<any>;

    if (either && either.success === false) {
      return actionResultError(either.error.errorType, either.error.errorText, either.error.errorStack);
    }

    return actionResult(either?.result);
  }

  return actionResult(nestedValue);
}

export function filterLogHistoryByActionTypes(history: ActionHistory<any>[], actionTypes: string[]): ActionHistory<any>[] {
  const result: ActionHistory<any>[] = [];

  function processHistory(histories: ActionHistory<any>[]) {
    for (const entry of histories) {
      const { act, startedAt, finishedAt, res } = entry;

      if (isBatchAction(act)) {
        // A successful batch result is an array with one value per nested action.
        // Slice it up so each flattened entry gets its own result; if the batch
        // itself errored there is nothing per-action, so keep the batch error.
        const batchValues = !isErroredActionResult(res) ? resolveActionResult(res) : undefined;

        // Create new ActionHistory entries for each nested action
        const nestedHistories = act.payload.actions.map((nestedAction, index) => {
          const newHistory: ActionHistory<any> = {
            act: nestedAction,
            res: Array.isArray(batchValues) ? getNestedActionResult(nestedAction, batchValues[index]) : res,
            startedAt,
            finishedAt,
          };

          return newHistory;
        });

        processHistory(nestedHistories);
      } else if (actionTypes.length == 0 || actionTypes.includes(act.type)) {
        result.push(entry);
      }
    }
  }

  processHistory(history);
  return result;
}
