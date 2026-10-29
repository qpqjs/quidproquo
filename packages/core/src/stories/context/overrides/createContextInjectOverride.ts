import { Action, ActionOverrideHandler, AskResponse, QpqContextIdentifier } from '../../../types';

// Rides this identifier's value on every other action that passes through, so the processor that
// handles it (and any service it crosses into) sees the context. Local context rides in a separate
// bag that is stripped at service boundaries.
export const createContextInjectOverride = <R>(contextIdentifier: QpqContextIdentifier<R>, value: R): ActionOverrideHandler<Action<any>> =>
  function* askContextInjectOverride(action): AskResponse<unknown> {
    const contextKey = contextIdentifier.local ? 'localContext' : 'context';

    // The parent's result is already correctly shaped, so we forward it verbatim.
    return yield {
      ...action,
      [contextKey]: {
        [contextIdentifier.uniqueName]: value,
        ...action[contextKey],
      },
    };
  };
