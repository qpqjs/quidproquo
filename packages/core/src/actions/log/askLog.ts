import { createActionRequester } from '../../logic/actions/createActionRequester';
import { DecomposedString, DecomposedStringPrimitive } from '../../types';
import { LogActionType } from './LogActionType';

export type LogTemplateLiteralActionPayload = {
  messageParts: DecomposedString;
};

/** Logs a template literal at info level; the parts are kept apart so the log viewer can render the variables separately. */
export const askLog = createActionRequester<void>()({
  actionType: LogActionType.TemplateLiteral,
  getPayload: (strings: TemplateStringsArray, ...variables: DecomposedStringPrimitive[]) => ({
    messageParts: [[...strings], variables] as DecomposedString,
  }),
});
