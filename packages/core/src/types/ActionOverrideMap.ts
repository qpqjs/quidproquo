import { ActionOverrideHandler } from './ActionOverrideHandler';

// A map of action type strings to their override handlers.
// The key is the action type (e.g. "MathActionType.RandomNumber") or "*" for a wildcard catch-all.
// The value is the handler function that will run instead of the normal action processor.
export type ActionOverrideMap = {
  [actionType: string]: ActionOverrideHandler<any, any>;
};
