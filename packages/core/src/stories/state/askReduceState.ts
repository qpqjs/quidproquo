import { StateActionType, StateDispatchAction, StateReadAction } from '../../actions/state';
import { QpqReducer } from '../../logic/stateEffects';
import { AskResponse } from '../../types';
import { askOverrideActions, getSuccessfulEitherActionResultIfRequired } from '../system/askOverrideActions';

// Runs an inner story purely for its dispatched state effects and returns the computed state.
//
// Every askStateDispatch the inner story yields is captured here (never reaches the runtime),
// fed through `reducer`, and accumulated into `state`. askStateRead returns the current
// accumulated state. When the inner story finishes, askReduceState returns the final state.
//
// This is the backend / pure-logic counterpart to the React useQPQ bubble-reducer hooks: it lets
// any code run the same QPQ state-dispatch logic without a runtime State processor.
export function* askReduceState<State, Effect>(
  initialState: State,
  reducer: QpqReducer<State, Effect>,
  story: () => AskResponse<void>,
): AskResponse<State> {
  let state = initialState;

  yield* askOverrideActions(story(), {
    [StateActionType.Dispatch]: function* (action: StateDispatchAction<Effect>) {
      const [nextState, handled] = reducer(state, action.payload.action);

      if (handled) {
        state = nextState;
        // A dispatch produces no value (void). We shape it ourselves for returnErrors.
        return getSuccessfulEitherActionResultIfRequired(undefined, action.returnErrors);
      }

      // Reducer didn't handle this effect — relay it so a parent askReduceState (or the runtime)
      // can handle it. The parent's result is forwarded to the inner dispatch verbatim (correct
      // under askCatch, including error propagation).
      return yield action;
    },

    [StateActionType.Read]: function* (action: StateReadAction) {
      // Mirror the React getStateReadActionProcessor: return the whole accumulated state and ignore
      // payload.path (path reads are unsupported everywhere today). We produce this value, so we
      // shape it for returnErrors.
      return getSuccessfulEitherActionResultIfRequired(state, action.returnErrors);
    },
  });

  return state;
}
