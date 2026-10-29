import { Action, AskResponse } from '../../../types';

// A tiny helper story that just yields a single action and returns whatever the processor gives back.
// We use this to wrap individual actions so we can pass them into askOverrideActions recursively.
// For example, when we pull an action out of a batch, we wrap it in this so askOverrideActions
// can intercept it as if it were a normal top-level action being yielded by a story.
export function* askProcessAction<R>(action: Action<any>): AskResponse<R> {
  return (yield action) as R;
}
