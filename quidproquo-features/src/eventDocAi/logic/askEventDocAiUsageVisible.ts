import { askConfigGetGlobal, AskResponse } from 'quidproquo-core';

import { EVENT_DOC_AI_SEND_USAGE_TO_FRONTEND_GLOBAL } from '../constants/eventDocAiGlobalNames';

/** Whether this chat is configured to let token usage reach the browser. */
export function* askEventDocAiUsageVisible(): AskResponse<boolean> {
  const sendUsageToFrontend = yield* askConfigGetGlobal<boolean | undefined>(EVENT_DOC_AI_SEND_USAGE_TO_FRONTEND_GLOBAL);

  return sendUsageToFrontend === true;
}
