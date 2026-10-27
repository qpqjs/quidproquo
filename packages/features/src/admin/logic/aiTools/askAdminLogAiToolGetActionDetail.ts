import { AskResponse } from 'quidproquo-core';

import { askEventDocAiContextRead } from '../../../eventDocAi';
import { logsLogic } from '../../log/logic';

export type AdminLogAiToolGetActionDetailInput = {
  index: number;
};

// See askAdminLogAiToolGetActions — same trusted-docId rule applies here.
export function* askAdminLogAiToolGetActionDetail(input: AdminLogAiToolGetActionDetailInput): AskResponse<logsLogic.LogAiToolActionDetail> {
  const { docId } = yield* askEventDocAiContextRead();

  return yield* logsLogic.askGetLogActionDetail(docId, input.index);
}
