import { Action, ActionRequester } from '../Action';
import { ActionRequesterDefinition, ActionRequesterFunction } from '../ActionRequesterFunction';
import { createErrorEnumForAction } from './createErrorEnumForAction';

// Curried because TypeScript has no partial type inference: the outer call pins the
// action's return type explicitly, the inner call infers the action type, args,
// payload shape and error catalog from the definition object.
export const createActionRequester =
  <TReturn>() =>
  <TType extends string, TArgs extends unknown[] = [], TPayload = undefined, TErrorTypes extends string = never>(
    definition: ActionRequesterDefinition<TType, TArgs, TPayload, TErrorTypes>,
  ): ActionRequesterFunction<TType, TArgs, TPayload, TReturn, TErrorTypes> => {
    // Payload-less actions omit getPayload; the cast pins the stand-in builder to the
    // defaulted TArgs = [] / TPayload = undefined.
    const getPayload = definition.getPayload ?? ((() => undefined) as (...args: TArgs) => TPayload);

    function* askAction(...args: TArgs): ActionRequester<Action<TPayload> & { type: TType }, TReturn> {
      const payload = getPayload(...args);

      // Payload-less actions yield { type } with no payload key at all, matching the
      // hand-written requester shape exactly.
      return yield payload === undefined ? { type: definition.actionType } : { type: definition.actionType, payload };
    }

    return Object.assign(askAction, {
      actionType: definition.actionType,
      getPayload,
      errorType: createErrorEnumForAction(definition.actionType, definition.errorTypes ?? []),
    });
  };
