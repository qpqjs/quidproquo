import { askBatch, askThrowError, SystemActionType, SystemBatchActionPayload } from '../../actions';
import { getSuccessfulEitherActionResult } from '../../logic/actionLogic';
import { Action, AskResponse, AskResponseReturnType, EitherActionResult } from '../../types';
import { askMapParallel } from '../array/askMapParallel';
import { askCatch } from './askCatch';

// A function that takes an action and returns a story (generator) that produces the override result.
// This is what the user provides for each action type they want to intercept.
export type ActionOverrideHandler<TAction extends Action<any> = Action<any>, TResult = any> = (action: TAction) => AskResponse<TResult>;

// A map of action type strings to their override handlers.
// The key is the action type (e.g. "MathActionType.RandomNumber") or "*" for a wildcard catch-all.
// The value is the handler function that will run instead of the normal action processor.
export type ActionOverrideMap = {
  [actionType: string]: ActionOverrideHandler<any, any>;
};

// Looks up a handler as an OWN property of the override map. A plain-object map inherits from
// Object.prototype, so an action type like "toString" or "constructor" would otherwise resolve
// to an inherited function and get invoked as a handler.
function getOwnOverrideHandler(overrides: ActionOverrideMap, actionType: string): ActionOverrideHandler | undefined {
  return Object.prototype.hasOwnProperty.call(overrides, actionType) ? overrides[actionType] : undefined;
}

// A tiny helper story that just yields a single action and returns whatever the processor gives back.
// We use this to wrap individual actions so we can pass them into askOverrideActions recursively.
// For example, when we pull an action out of a batch, we wrap it in this so askOverrideActions
// can intercept it as if it were a normal top-level action being yielded by a story.
function* askProcessAction<R>(action: Action<any>): AskResponse<R> {
  return (yield action) as R;
}

// Shapes a handler's OWN computed value into what the story expects.
//
// When an action has returnErrors set to true (because askCatch wrapped it), the story expects the
// result wrapped in { success: true, result: value }. The runtime normally does this, but an override
// bypasses the runtime — so a handler that returns a value it computed itself must shape it with this
// helper (passing the action's returnErrors). If returnErrors is false/undefined it returns the value
// unchanged.
//
// Handlers that simply RELAY the action with `return yield action` must NOT call this: the value they
// get back from the parent is already in the right shape (raw, or an EitherActionResult when the
// action carried returnErrors), and the engine forwards a handler's return value verbatim.
export function getSuccessfulEitherActionResultIfRequired<T, ReturnErrors extends boolean>(
  value: T,
  returnErrors?: ReturnErrors,
): ReturnErrors extends true ? EitherActionResult<T> : T {
  if (returnErrors) {
    return getSuccessfulEitherActionResult(value) as ReturnErrors extends true ? EitherActionResult<T> : T;
  } else {
    // returnErrors is false, so just pass the raw value through unchanged
    return value as ReturnErrors extends true ? EitherActionResult<T> : T;
  }
}

// This is the main function. It sits between a story and the runtime, intercepting actions
// as the story yields them. If an action matches one of the overrides (by type or wildcard "*"),
// we run the override handler instead of letting the runtime process it. If the action doesn't
// match any override, we yield it up to the parent (the runtime) and let it handle things normally.
//
// The tricky part is batches. When stories run things in parallel (askRunParallel), the actions
// get bundled into a single batch action. We need to crack open the batch, check each action
// inside for overrides, handle those ourselves, and then send the remaining non-overridden
// actions back out as a smaller batch for the runtime to process. We also need to handle
// batches-inside-batches by recursing, so overrides work no matter how deeply nested things are.
export function* askOverrideActions<T extends AskResponse<any>>(
  storyIterator: T,
  overrides: ActionOverrideMap,
): AskResponse<AskResponseReturnType<T>> {
  // Kick off the story by calling .next() to get the first yielded action
  let nextResult = storyIterator.next();

  // Keep looping as long as the story has more actions to yield.
  // When the story is done (returns a value instead of yielding), nextResult.done will be true.
  while (!nextResult.done) {
    // This is the action the story just yielded - it wants someone to process it
    const action = nextResult.value;

    // Check if we have an override for this specific action type, or a "*" wildcard catch-all.
    // The specific type takes priority over the wildcard because we check it first.
    const handler =
      getOwnOverrideHandler(overrides, action.type) || (action.type !== SystemActionType.Batch ? getOwnOverrideHandler(overrides, '*') : undefined);
    if (handler) {
      // We have an override! Run the user's handler instead of letting the runtime process it.
      // The handler is itself a story (generator), so we yield* into it to run it.
      //
      // We feed the handler's return value to the story VERBATIM — we never reshape it. That is what
      // lets a handler relay an action with a bare `return yield action`: the value it gets back from
      // the parent (raw, or an EitherActionResult when the action carries returnErrors, e.g. under
      // askCatch) is already exactly what the story expects. A handler that instead returns its OWN
      // computed value is responsible for shaping it (see getSuccessfulEitherActionResultIfRequired).
      nextResult = storyIterator.next(yield* handler(action));

      // Skip to the next iteration of the while loop to process the next yielded action
      continue;
    }

    // If we get here, the action wasn't directly overridden.
    // But it might be a batch action (from askRunParallel / askBatch) that contains
    // overridden actions inside it. We need to crack it open and check each one.
    if (action.type === SystemActionType.Batch) {
      // Pull out the list of individual actions that are bundled inside this batch
      const batchActionPayload: SystemBatchActionPayload = action.payload;

      // Go through every action in the batch one by one using askMap.
      // For each action, we figure out if we need to handle it ourselves (override or nested batch)
      // or if we can leave it for the runtime to process in the remaining batch.
      const batchActionsToRun = yield* askMapParallel(batchActionPayload.actions, function* (batchAction) {
        // Does this individual action have an override handler (specific type or wildcard)?
        const isOverridden = !!(getOwnOverrideHandler(overrides, batchAction.type) || getOwnOverrideHandler(overrides, '*'));

        // Is this individual action itself another batch? If so, it could contain overridden
        // actions deeper inside, so we need to recurse into it even though we don't override
        // the batch action itself.
        const isBatch = batchAction.type === SystemActionType.Batch;

        // We need to recursively process this action if it's either:
        // 1. Directly overridden (we have a handler for it)
        // 2. A nested batch (it might contain overridden actions inside)
        const needsRecursion = isOverridden || isBatch;

        return {
          action: batchAction,
          // Track whether we already processed this action ourselves, so we know not to
          // send it to the runtime again later
          alreadyProcessed: needsRecursion,
          // If we need to process it, wrap the action in askProcessAction (which makes it look
          // like a story that yields one action) and run it through askOverrideActions recursively.
          // This handles both direct overrides and nested batches-within-batches.
          //
          // The recursion is wrapped in askCatch so a failing sub-action becomes a captured
          // failure for THIS slot instead of escaping bare and bypassing the enclosing batch's
          // returnErrors protection. All slot results are held as EitherActionResults; the
          // successful ones are unwrapped when the batch is reassembled below.
          //
          // If we don't need to process it, leave the result undefined for now - the runtime
          // will fill it in when we send the remaining batch.
          result: needsRecursion ? yield* askCatch(askOverrideActions(askProcessAction(batchAction), overrides)) : undefined,
        };
      });

      // Now split the batch actions into two groups:
      // - alreadyProcessed: we handled these above (overridden or nested batches) and have results
      // - remaining: these are normal actions we need to send to the runtime to process
      const remainingBatchActionsToRun = batchActionsToRun.filter((ba) => !ba.alreadyProcessed);

      // Send the remaining non-overridden actions to the runtime as a batch.
      // We wrap this in askCatch so that if any action in the batch fails, we get the error
      // back as a value instead of it throwing and killing everything.
      const results = yield* askCatch(askBatch(remainingBatchActionsToRun.map((ba) => ba.action)));

      // If the batch succeeded, take each result from the runtime and attach it to the
      // corresponding action object (wrapped so every slot holds an EitherActionResult),
      // so we can reassemble the full results array later.
      if (results.success) {
        remainingBatchActionsToRun.forEach((ba, index) => {
          ba.result = getSuccessfulEitherActionResult(results.result[index]);
        });
      }

      // One failure fails the whole batch, matching the runtime's batch semantics: a runtime
      // batch failure wins, otherwise the first captured failure from an overridden slot.
      const isFailedSlotResult = (slotResult: EitherActionResult<any> | undefined): slotResult is EitherActionResult<any> & { success: false } =>
        slotResult !== undefined && !slotResult.success;
      const failedResult = !results.success ? results : batchActionsToRun.map((ba) => ba.result).find(isFailedSlotResult);

      // If any sub-action failed (in the runtime batch or in an overridden slot)
      if (failedResult) {
        // Check if the caller wants errors returned as values (askCatch set returnErrors: true)
        if (!action.returnErrors) {
          // No askCatch protecting this, so throw the error up to crash the story
          return yield* askThrowError(failedResult.error.errorType, failedResult.error.errorText, failedResult.error.errorStack);
        } else {
          // askCatch is protecting this, so pass the error back as a value
          nextResult = storyIterator.next(failedResult);
        }
      } else {
        // Everything succeeded! Reassemble the results in the original order, unwrapping each
        // slot's EitherActionResult back to its raw value, then wrap the whole array for the
        // caller if needed (same returnErrors logic as the single action case above).
        const allResults = batchActionsToRun.map((ba) => ba.result?.result);

        nextResult = storyIterator.next(getSuccessfulEitherActionResultIfRequired(allResults, action.returnErrors));
      }

      // Skip to the next iteration to process whatever the story yields next
      continue;
    }

    // If we get here, this action is not overridden and not a batch.
    // We have nothing special to do, so just yield it up to our parent (the runtime)
    // and let it process the action normally.
    const actionValue = yield action;

    // Take whatever the runtime gave us back and pass it down to the story,
    // so the story gets the result it was waiting for.
    nextResult = storyIterator.next(actionValue);
  }

  // The story is done! nextResult.value is the final return value of the generator.
  // Pass it through as our own return value.
  return nextResult.value;
}
