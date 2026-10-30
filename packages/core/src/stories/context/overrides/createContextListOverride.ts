import { askThrowError } from '../../../actions';
import { ContextActionType } from '../../../actions/context';
import { askContextList } from '../../../actions/context/askContextList';
import { ActionOf, ActionOverrideHandler, AskResponse, EitherActionResult, Nullable, QpqContext, QpqContextIdentifier } from '../../../types';
import { getSuccessfulEitherActionResultIfRequired } from '../../system/overrideActions';

// Answers a context list with the parent's list plus this identifier's value. The parent's list is
// asked for once and kept for the life of the provide. A local identifier is not part of the
// cross-service context list, so its override stays transparent.
export const createContextListOverride = <R>(
  contextIdentifier: QpqContextIdentifier<R>,
  value: R,
): ActionOverrideHandler<ActionOf<typeof askContextList>> => {
  let cache: Nullable<QpqContext<any>> = null;

  return function* askContextListOverride(action): AskResponse<unknown> {
    if (contextIdentifier.local) {
      return yield action;
    }

    if (cache === null) {
      const parentContextValues = (yield {
        type: ContextActionType.List,
        returnErrors: true,
      }) as EitherActionResult<QpqContext<any>>;

      // A failed parent list must propagate, not be masked as an empty parent context.
      // The failure Either is already the shape the inner action expects when it carries
      // returnErrors; otherwise rethrow so the error surfaces as normal.
      if (!parentContextValues.success) {
        if (action.returnErrors) {
          return parentContextValues;
        }

        return yield* askThrowError(parentContextValues.error.errorType, parentContextValues.error.errorText, parentContextValues.error.errorStack);
      }

      cache = {
        ...(parentContextValues.result || {}),
        [contextIdentifier.uniqueName]: value,
      };
    }

    // We produce this value ourselves, so we shape it for returnErrors.
    return getSuccessfulEitherActionResultIfRequired(cache, action.returnErrors);
  };
};
