import { AskResponse } from '@qpqjs/core';

import { askEventDocAiChatRowsQueryAll } from '../data/askEventDocAiChatRowsQueryAll';
import type { EventDocAiChatMessage } from '../models';
import { EventDocAiChatRowKind } from '../models/EventDocAiChatRowKind';
import { eventDocAiChatRowsToMessages } from '../module/logic/eventDocAiChatRowsToMessages';
import { askEventDocAiChatRowsResolve } from './askEventDocAiChatRowsResolve';

/**
 * A whole chat as messages, for the model: every row, with the content held in storage read back in. Usage rows
 * are left out, the model never sees them.
 */
export function* askEventDocAiChatMessagesLoad(docId: string, chatId: string): AskResponse<EventDocAiChatMessage[]> {
  const rows = (yield* askEventDocAiChatRowsQueryAll(docId, chatId)).filter((row) => row.kind !== EventDocAiChatRowKind.Usage);

  return eventDocAiChatRowsToMessages(yield* askEventDocAiChatRowsResolve(docId, chatId, rows));
}
