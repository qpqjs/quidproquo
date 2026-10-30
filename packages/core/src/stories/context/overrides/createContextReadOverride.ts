import { askContextReadBase } from '../../../actions/context/askContextRead';
import { ActionOf, ActionOverrideHandler, AskResponse, QpqContextIdentifier } from '../../../types';
import { getSuccessfulEitherActionResultIfRequired } from '../../system/overrideActions';

// Answers a read of this identifier with the provided value; any other identifier is relayed to the parent.
export const createContextReadOverride = <R>(
  contextIdentifier: QpqContextIdentifier<R>,
  value: R,
): ActionOverrideHandler<ActionOf<typeof askContextReadBase>> =>
  function* askContextReadOverride(action): AskResponse<unknown> {
    if (action.payload.contextIdentifier.uniqueName === contextIdentifier.uniqueName) {
      // We produce this value ourselves, so we shape it for returnErrors.
      return getSuccessfulEitherActionResultIfRequired(value, action.returnErrors);
    }

    // Not our identifier, relay the action and forward its result verbatim.
    return yield action;
  };
