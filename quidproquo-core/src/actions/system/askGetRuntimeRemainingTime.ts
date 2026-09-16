import { createActionRequester } from '../../types';
import { SystemActionType } from './SystemActionType';

/**
 * Milliseconds left before the platform kills the current execution. Long loops
 * (agentic AI turns, batch sweeps) check this between steps and hand off before the
 * hard cutoff. Runtimes with no execution limit return Number.MAX_SAFE_INTEGER.
 */
export const askGetRuntimeRemainingTime = createActionRequester<number>()({
  actionType: SystemActionType.GetRuntimeRemainingTime,
});
