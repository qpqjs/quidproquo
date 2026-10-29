import { AskResponse } from '@qpqjs/core';

import { askEventDocAiRead } from '../../../eventDocAi';
import { logsLogic } from '../../log/logic';

// Tool executor for the log chat. The model never supplies which log to read ,
// docId is the open log's correlation id, trusted from the EventDocAi session
// context (see askEventDocAiProcessSend's comment on why), never from model input.
export function* askAdminLogAiToolGetActions(): AskResponse<logsLogic.LogAiToolActionSummary[]> {
  const { docId } = yield* askEventDocAiRead();

  return yield* logsLogic.askGetLogActionsForCorrelation(docId);
}
