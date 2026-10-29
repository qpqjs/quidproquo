import { Action } from './Action';
import { AskResponse } from './StorySession';

// A function that takes an action and returns a story (generator) that produces the override result.
// This is what the user provides for each action type they want to intercept.
export type ActionOverrideHandler<TAction extends Action<any> = Action<any>, TResult = any> = (action: TAction) => AskResponse<TResult>;

// A map of action type strings to their override handlers.
// The key is the action type (e.g. "MathActionType.RandomNumber") or "*" for a wildcard catch-all.
// The value is the handler function that will run instead of the normal action processor.
export type ActionOverrideMap = {
  [actionType: string]: ActionOverrideHandler<any, any>;
};
