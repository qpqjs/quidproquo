import { askBatch, askThrowError, SystemActionType, SystemBatchActionPayload } from '../../../actions';
import { getSuccessfulEitherActionResult } from '../../../logic/actionResult';
import { Action, AskResponse, EitherActionResult } from '../../../types';
import { ActionOverrideMap } from '../../../types/ActionOverride';
import { askMapParallel } from '../../array/askMapParallel';
import { askCatch } from '../askCatch';
import { getOwnOverrideHandler } from './getOwnOverrideHandler';
import { getSuccessfulEitherActionResultIfRequired } from './getSuccessfulEitherActionResultIfRequired';

// How an overridden (or nested batch) slot is run. askOverrideActions passes itself in here, so the
// batch splitting never has to import the loop it is part of.
export type AskOverrideSlot = (batchAction: Action<any>) => AskResponse<unknown>;

const isFailedSlotResult = (slotResult: EitherActionResult<any> | undefined): slotResult is EitherActionResult<any> & { success: false } =>
  slotResult !== undefined && !slotResult.success;

// When stories run things in parallel (askRunParallel), the actions get bundled into a single batch
// action. This cracks the batch open, runs every overridden slot (and every nested batch, which may
// hold overridden actions deeper inside) through `askOverrideSlot`, sends the rest to the runtime as
// a smaller batch, and reassembles the results in the original order. Returns the value the story
// should be resumed with; a failure throws unless the batch carries returnErrors, in which case the
// failure comes back as the value, matching what the runtime would do.
export function* askOverrideBatch(action: Action<any>, overrides: ActionOverrideMap, askOverrideSlot: AskOverrideSlot): AskResponse<unknown> {
  const batchActionPayload: SystemBatchActionPayload = action.payload;

  const batchActionsToRun = yield* askMapParallel(batchActionPayload.actions, function* askRunSlot(batchAction) {
    const isOverridden = !!(getOwnOverrideHandler(overrides, batchAction.type) || getOwnOverrideHandler(overrides, '*'));
    const isBatch = batchAction.type === SystemActionType.Batch;
    const needsRecursion = isOverridden || isBatch;

    return {
      action: batchAction,
      // Already processed here, so it must not be sent to the runtime again below.
      alreadyProcessed: needsRecursion,
      // The slot run is wrapped in askCatch so a failing sub-action becomes a captured failure for
      // THIS slot instead of escaping bare and bypassing the enclosing batch's returnErrors
      // protection. Every slot holds an EitherActionResult; the successful ones are unwrapped when
      // the batch is reassembled.
      result: needsRecursion ? yield* askCatch(askOverrideSlot(batchAction)) : undefined,
    };
  });

  const remainingBatchActionsToRun = batchActionsToRun.filter((ba) => !ba.alreadyProcessed);

  // askCatch so a failing runtime batch comes back as a value instead of killing everything.
  const results = yield* askCatch(askBatch(remainingBatchActionsToRun.map((ba) => ba.action)));

  if (results.success) {
    remainingBatchActionsToRun.forEach((ba, index) => {
      ba.result = getSuccessfulEitherActionResult(results.result[index]);
    });
  }

  // One failure fails the whole batch, matching the runtime's batch semantics: a runtime
  // batch failure wins, otherwise the first captured failure from an overridden slot.
  const failedResult = !results.success ? results : batchActionsToRun.map((ba) => ba.result).find(isFailedSlotResult);

  if (failedResult) {
    if (!action.returnErrors) {
      return yield* askThrowError(failedResult.error.errorType, failedResult.error.errorText, failedResult.error.errorStack);
    }

    return failedResult;
  }

  const allResults = batchActionsToRun.map((ba) => ba.result?.result);

  return getSuccessfulEitherActionResultIfRequired(allResults, action.returnErrors);
}
