import { DecomposedString, DecomposedStringPrimitive } from '../../types';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { LogActionType } from './LogActionType';

export type LogTemplateLiteralActionPayload = {
  messageParts: DecomposedString;
};

export const askLogTemplateLiteral = createActionRequester<void>()({
  actionType: LogActionType.TemplateLiteral,
  getPayload: (strings: TemplateStringsArray, ...variables: DecomposedStringPrimitive[]) => ({
    messageParts: [[...strings], variables] as DecomposedString,
  }),
});

export const askLog = askLogTemplateLiteral;
