import { AskResponse, askStateRead } from '@qpqjs/core';

import { askUiCatch } from '../../ui/logic/askUiCatch';
import type { EventDocAiAttachment } from '../models';
import { askEventDocAiAppendChatMessage } from '../module/actionCreators/askEventDocAiAppendChatMessage';
import { askEventDocAiClearStream } from '../module/actionCreators/askEventDocAiClearStream';
import { askEventDocAiSetError } from '../module/actionCreators/askEventDocAiSetError';
import { askEventDocAiSetMessages } from '../module/actionCreators/askEventDocAiSetMessages';
import { askEventDocAiSetSending } from '../module/actionCreators/askEventDocAiSetSending';
import { makeEventDocAiUserMessage } from '../module/logic/makeEventDocAiUserMessage';
import type { EventDocAiState } from '../module/types/EventDocAiState';
import { askEventDocAiChatSendRequest } from '../transport/askEventDocAiChatSendRequest';
import { askEventDocAiNewChat } from './askEventDocAiNewChat';

export function* askEventDocAiSendMessage(message: string, attachments: EventDocAiAttachment[] = []): AskResponse<void> {
  const { activeChatId, chatMessages } = yield* askStateRead<EventDocAiState>();

  // First message with no chat selected, create one implicitly.
  let chatId = activeChatId;
  if (!chatId) {
    const chat = yield* askEventDocAiNewChat();
    if (!chat) {
      return;
    }
    chatId = chat.chatId;
  }

  // The user's message shows at once; if the send fails the chat goes back to what the
  // server holds, so the composer can retry without a dangling unsent bubble.
  yield* askEventDocAiAppendChatMessage(makeEventDocAiUserMessage(message, attachments));

  yield* askEventDocAiClearStream();

  // The assistant's reply streams in via AppendStreamChunk dispatches while
  // this request is in flight; the finalized message is dispatched by the
  // backend before the request resolves.
  const result = yield* askUiCatch(askEventDocAiChatSendRequest({ chatId, message, attachments }), {
    askSetError: askEventDocAiSetError,
    askSetBusy: askEventDocAiSetSending,
  });

  yield* askEventDocAiClearStream();

  if (!result.success) {
    yield* askEventDocAiSetMessages(chatMessages);
  }
}
