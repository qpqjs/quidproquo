import { SystemActionType } from '../../../actions';
import { AskResponse, AskResponseReturnType } from '../../../types';
import { ActionOverrideMap } from '../../../types/ActionOverride';
import { askOverrideBatch } from './askOverrideBatch';
import { askProcessAction } from './askProcessAction';
import { getOwnOverrideHandler } from './getOwnOverrideHandler';

// Sits between a story and the runtime, intercepting actions as the story yields them. An action
// with an override (by type, or the "*" wildcard) runs the handler instead of the runtime; a batch
// is cracked open by askOverrideBatch so overrides apply however deeply the batches nest; anything
// else is yielded up to the parent untouched.
export function* askOverrideActions<T extends AskResponse<any>>(
  storyIterator: T,
  overrides: ActionOverrideMap,
): AskResponse<AskResponseReturnType<T>> {
  let nextResult = storyIterator.next();

  while (!nextResult.done) {
    const action = nextResult.value;

    // The specific type takes priority over the wildcard. A batch is never handed to the wildcard
    // as a whole; its members are checked one by one instead.
    const handler =
      getOwnOverrideHandler(overrides, action.type) || (action.type !== SystemActionType.Batch ? getOwnOverrideHandler(overrides, '*') : undefined);

    if (handler) {
      // The handler's return value is fed to the story VERBATIM, never reshaped. That is what lets
      // a handler relay an action with a bare `return yield action`: what it gets back from the
      // parent (raw, or an EitherActionResult when the action carries returnErrors, e.g. under
      // askCatch) is already what the story expects. A handler that returns its OWN computed value
      // shapes it with getSuccessfulEitherActionResultIfRequired.
      nextResult = storyIterator.next(yield* handler(action));
      continue;
    }

    if (action.type === SystemActionType.Batch) {
      nextResult = storyIterator.next(
        yield* askOverrideBatch(action, overrides, (batchAction) => askOverrideActions(askProcessAction(batchAction), overrides)),
      );
      continue;
    }

    nextResult = storyIterator.next(yield action);
  }

  return nextResult.value;
}
