import { ActionOverrideHandler, ActionOverrideMap } from '../../../types/ActionOverride';

// Looks up a handler as an OWN property of the override map. A plain-object map inherits from
// Object.prototype, so an action type like "toString" or "constructor" would otherwise resolve
// to an inherited function and get invoked as a handler.
export const getOwnOverrideHandler = (overrides: ActionOverrideMap, actionType: string): ActionOverrideHandler | undefined =>
  Object.prototype.hasOwnProperty.call(overrides, actionType) ? overrides[actionType] : undefined;
