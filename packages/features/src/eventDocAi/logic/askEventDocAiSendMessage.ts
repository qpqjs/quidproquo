import { AskResponse, askStateRead } from '@qpqjs/core';

import { askUiCatch } from '../../ui/logic/askUiCatch';
import type { EventDocAiAttachment } from '../models';
import { askUIEventDocAiAppendChatMessage } from '../module/actionCreators/askUIEventDocAiAppendChatMessage';
import { askUIEventDocAiClearStream } from '../module/actionCreators/askUIEventDocAiClearStream';
import { askUIEventDocAiSetError } from '../module/actionCreators/askUIEventDocAiSetError';
import { askUIEventDocAiSetMessages } from '../module/actionCreators/askUIEventDocAiSetMessages';
import { askUIEventDocAiSetSending } from '../module/actionCreators/askUIEventDocAiSetSending';
import type { EventDocAiState } from '../module/EventDocAiState';
import { makeEventDocAiUserMessage } from '../module/utils/makeEventDocAiUserMessage';
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
  yield* askUIEventDocAiAppendChatMessage(makeEventDocAiUserMessage(message, attachments));

  yield* askUIEventDocAiClearStream();

  // The assistant's reply streams in via AppendStreamChunk dispatches while
  // this request is in flight; the finalized message is dispatched by the
  // backend before the request resolves.
  const result = yield* askUiCatch(askEventDocAiChatSendRequest({ chatId, message, attachments }), {
    askSetError: askUIEventDocAiSetError,
    askSetBusy: askUIEventDocAiSetSending,
  });

  yield* askUIEventDocAiClearStream();

  if (!result.success) {
    yield* askUIEventDocAiSetMessages(chatMessages);
  }
}
