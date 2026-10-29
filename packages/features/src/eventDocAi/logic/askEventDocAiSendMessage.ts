import { askCatch, AskResponse, askStateRead } from '@qpqjs/core';

import type { EventDocAiAttachment } from '../models';
import { askUIEventDocAiAppendChatMessage } from '../module/actionCreators/askUIEventDocAiAppendChatMessage';
import { askUIEventDocAiClearStream } from '../module/actionCreators/askUIEventDocAiClearStream';
import { askUIEventDocAiSetError } from '../module/actionCreators/askUIEventDocAiSetError';
import { askUIEventDocAiSetSending } from '../module/actionCreators/askUIEventDocAiSetSending';
import type { EventDocAiState } from '../module/EventDocAiState';
import { makeEventDocAiUserMessage } from '../module/utils/makeEventDocAiUserMessage';
import { askEventDocAiChatSendRequest } from '../transport/askEventDocAiChatSendRequest';
import { askEventDocAiNewChat } from './askEventDocAiNewChat';

export function* askEventDocAiSendMessage(message: string, attachments: EventDocAiAttachment[] = []): AskResponse<void> {
  const { activeChatId } = yield* askStateRead<EventDocAiState>();

  // First message with no chat selected, create one implicitly.
  let chatId = activeChatId;
  if (!chatId) {
    const chat = yield* askEventDocAiNewChat();
    if (!chat) {
      return;
    }
    chatId = chat.chatId;
  }

  yield* askUIEventDocAiSetError(null);

  yield* askUIEventDocAiAppendChatMessage(makeEventDocAiUserMessage(message, attachments));

  yield* askUIEventDocAiClearStream();
  yield* askUIEventDocAiSetSending(true);

  // The assistant's reply streams in via AppendStreamChunk dispatches while
  // this request is in flight; the finalized message is dispatched by the
  // backend before the request resolves.
  const result = yield* askCatch(askEventDocAiChatSendRequest({ chatId, message, attachments }), askUIEventDocAiSetSending(false));

  yield* askUIEventDocAiClearStream();

  if (!result.success) {
    yield* askUIEventDocAiSetError(result.error.errorText);
  }
}
