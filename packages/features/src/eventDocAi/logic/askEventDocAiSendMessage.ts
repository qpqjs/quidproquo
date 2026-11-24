import { askCatch, askLogCreate, AskResponse, askStateRead, LogLevelEnum } from '@qpqjs/core';

import { askUiCatch } from '../../ui/logic/askUiCatch';
import type { EventDocAiAttachment } from '../models';
import { EventDocAiLoadChatRowsMode } from '../models/EventDocAiLoadChatRowsMode';
import { askEventDocAiAppendChatMessage } from '../module/actionCreators/askEventDocAiAppendChatMessage';
import { askEventDocAiClearStream } from '../module/actionCreators/askEventDocAiClearStream';
import { askEventDocAiSetError } from '../module/actionCreators/askEventDocAiSetError';
import { askEventDocAiSetSending } from '../module/actionCreators/askEventDocAiSetSending';
import { makeEventDocAiUserMessage } from '../module/logic/makeEventDocAiUserMessage';
import type { EventDocAiState } from '../module/types/EventDocAiState';
import { askEventDocAiChatSendRequest } from '../transport/askEventDocAiChatSendRequest';
import { askEventDocAiChatRowContentsFill } from './askEventDocAiChatRowContentsFill';
import { askEventDocAiLoadChatRows } from './askEventDocAiLoadChatRows';
import { askEventDocAiNewChat } from './askEventDocAiNewChat';

// The server saves the question, and then the reply as it streams, before the steps that can still fail, so a
// failed send cannot be undone from a snapshot taken before it: that would drop turns the server holds and make a
// retry save the question twice. The chat is reloaded from the server instead, and only while the user is still on
// it; switching chats mid-send loads the other chat's history itself and must not be overwritten. The same reload
// repairs a send that worked but whose reply did not all reach this browser.
function* askEventDocAiReloadChat(chatId: string): AskResponse<void> {
  const { activeChatId } = yield* askStateRead<EventDocAiState>();
  if (activeChatId !== chatId) {
    return;
  }

  // The messages on screen stay until every page is in, so a reload never flashes an empty chat.
  const history = yield* askCatch(askEventDocAiLoadChatRows(chatId, EventDocAiLoadChatRowsMode.ReplaceWhenLoaded));
  if (!history.success) {
    // Any send error already shows; the stale bubbles stay until the chat is reopened.
    yield* askLogCreate(LogLevelEnum.Warn, 'eventDocAi: chat could not be reloaded after a send', {
      chatId,
      errorText: history.error.errorText,
    });
    return;
  }

  if (history.result) {
    yield* askEventDocAiChatRowContentsFill(chatId, history.result);
  }
}

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

  // The user's message shows at once; if the send fails the chat is reloaded from what the
  // server holds, so the composer can retry without a dangling unsent bubble.
  yield* askEventDocAiAppendChatMessage(makeEventDocAiUserMessage(message, attachments));

  yield* askEventDocAiClearStream();

  // The assistant's reply streams in via AppendStreamChunk dispatches while
  // this request is in flight; the backend dispatches FinalizeStream, which
  // turns it into a finalized message, before the request resolves.
  const result = yield* askUiCatch(askEventDocAiChatSendRequest({ chatId, message, attachments }), {
    askSetError: askEventDocAiSetError,
    askSetBusy: askEventDocAiSetSending,
  });

  // A reply still streaming once the send has ended was never finalized: its finalize signal was lost.
  const { isHistoryStale, streamSegments } = yield* askStateRead<EventDocAiState>();

  yield* askEventDocAiClearStream();

  if (!result.success || isHistoryStale || streamSegments.length > 0) {
    yield* askEventDocAiReloadChat(chatId);
  }
}
