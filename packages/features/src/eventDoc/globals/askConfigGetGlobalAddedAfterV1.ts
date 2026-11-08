import { askCatch, askConfigGetGlobal, AskResponse } from '@qpqjs/core';

/**
 * An optional hook global, or '' when it was never set: routes registered before the key existed have no global at
 * all, and that must read as "not configured" rather than throw.
 */
export function* askConfigGetGlobalAddedAfterV1(globalName: string): AskResponse<string> {
  const result = yield* askCatch(askConfigGetGlobal<string>(globalName));
  return (result.success && result.result) || '';
}
