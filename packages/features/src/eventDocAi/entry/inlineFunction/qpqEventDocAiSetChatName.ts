import { AskResponse, askThrowError, ErrorTypeEnum } from '@qpqjs/core';

import { askEventDocAiRead } from '../../context';
import { askEventDocAiChatRename } from '../../logic/askEventDocAiChatRename';
import type { EventDocAiSetChatNameResult } from '../../models';

/**
 * The setChatName tool: names the chat the turn is running for. The document and chat come from the trusted
 * context the turn provides, never from the model, so the model cannot be talked into renaming another chat.
 */
export function* qpqEventDocAiSetChatName(payload: { name?: unknown }): AskResponse<EventDocAiSetChatNameResult> {
  const { docId, chatId } = yield* askEventDocAiRead();

  if (!chatId) {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, 'There is no chat to name here.');
  }

  yield* askEventDocAiChatRename(docId, chatId, payload?.name);

  return { ok: true };
}
