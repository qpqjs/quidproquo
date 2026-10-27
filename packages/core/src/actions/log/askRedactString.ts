import { createActionRequester } from '../../types';
import { LogActionType } from './LogActionType';

/**
 * Marks a value as sensitive in this story's log: the admin log redaction removes it from every
 * string in the log, including entries recorded before this call (and this call's own entry). Does
 * nothing at runtime. Only this story's log is covered: a value handed to another service (in a
 * queue message, an email, a service function) must be marked there too.
 */
export const askRedactString = createActionRequester<void>()({
  actionType: LogActionType.RedactString,
  getPayload: (value: string) => ({ value }),
});
