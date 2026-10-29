import { ContextActionType } from '../../actions/context';
import { AskResponse, AskResponseReturnType, QpqContextIdentifier } from '../../types';
import { askOverrideActions } from '../system/overrideActions';
import { createContextInjectOverride } from './overrides/createContextInjectOverride';
import { createContextListOverride } from './overrides/createContextListOverride';
import { createContextReadOverride } from './overrides/createContextReadOverride';

// Runs the story with this identifier's value in context: reads of it are answered here, context
// lists include it, and every other action carries it onward.
export function* askContextProvideValue<R, T extends AskResponse<any>>(
  contextIdentifier: QpqContextIdentifier<R>,
  value: R,
  storyIterator: T,
): AskResponse<AskResponseReturnType<T>> {
  return yield* askOverrideActions(storyIterator, {
    [ContextActionType.Read]: createContextReadOverride(contextIdentifier, value),
    [ContextActionType.List]: createContextListOverride(contextIdentifier, value),
    '*': createContextInjectOverride(contextIdentifier, value),
  });
}
