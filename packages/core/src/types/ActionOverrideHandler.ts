import { Action } from './Action';
import { AskResponse } from './StorySession';

// A function that takes an action and returns a story (generator) that produces the override result.
// This is what the user provides for each action type they want to intercept.
export type ActionOverrideHandler<TAction extends Action<any> = Action<any>, TResult = any> = (action: TAction) => AskResponse<TResult>;
