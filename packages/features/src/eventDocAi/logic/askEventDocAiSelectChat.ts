import { AskResponse } from '@qpqjs/core';

import { askUiCatch } from '../../ui/logic/askUiCatch';
import { askEventDocAiClearStream } from '../module/actionCreators/askEventDocAiClearStream';
import { askEventDocAiSetActiveChat } from '../module/actionCreators/askEventDocAiSetActiveChat';
import { askEventDocAiSetError } from '../module/actionCreators/askEventDocAiSetError';
import { askEventDocAiSetLoadingHistory } from '../module/actionCreators/askEventDocAiSetLoadingHistory';
import { askEventDocAiSetMessages } from '../module/actionCreators/askEventDocAiSetMessages';
import { askEventDocAiChatHistoryRequest } from '../transport/askEventDocAiChatHistoryRequest';

export function* askEventDocAiSelectChat(chatId: string): AskResponse<void> {
  yield* askEventDocAiSetActiveChat(chatId);
  yield* askEventDocAiSetMessages([]);
  yield* askEventDocAiClearStream();

  const result = yield* askUiCatch(askEventDocAiChatHistoryRequest({ chatId }), {
    askSetError: askEventDocAiSetError,
    askSetBusy: askEventDocAiSetLoadingHistory,
  });

  if (result.success) {
    yield* askEventDocAiSetMessages(result.result);
  }
}
