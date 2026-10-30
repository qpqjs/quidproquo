import { getSuccessfulEitherActionResult } from '../../../logic/actionResult';
import { EitherActionResult } from '../../../types';

// Shapes a handler's OWN computed value into what the story expects.
//
// When an action has returnErrors set to true (because askCatch wrapped it), the story expects the
// result wrapped in { success: true, result: value }. The runtime normally does this, but an override
// bypasses the runtime, so a handler that returns a value it computed itself must shape it with this
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
