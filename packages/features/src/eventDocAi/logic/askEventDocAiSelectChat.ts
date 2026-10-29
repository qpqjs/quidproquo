import { AskResponse } from '@qpqjs/core';

import { askUiCatch } from '../../ui/logic/askUiCatch';
import { askUIEventDocAiClearStream } from '../module/actionCreators/askUIEventDocAiClearStream';
import { askUIEventDocAiSetActiveChat } from '../module/actionCreators/askUIEventDocAiSetActiveChat';
import { askUIEventDocAiSetError } from '../module/actionCreators/askUIEventDocAiSetError';
import { askUIEventDocAiSetLoadingHistory } from '../module/actionCreators/askUIEventDocAiSetLoadingHistory';
import { askUIEventDocAiSetMessages } from '../module/actionCreators/askUIEventDocAiSetMessages';
import { askEventDocAiChatHistoryRequest } from '../transport/askEventDocAiChatHistoryRequest';

export function* askEventDocAiSelectChat(chatId: string): AskResponse<void> {
  yield* askUIEventDocAiSetActiveChat(chatId);
  yield* askUIEventDocAiSetMessages([]);
  yield* askUIEventDocAiClearStream();

  const result = yield* askUiCatch(askEventDocAiChatHistoryRequest({ chatId }), {
    askSetError: askUIEventDocAiSetError,
    askSetBusy: askUIEventDocAiSetLoadingHistory,
  });

  if (result.success) {
    yield* askUIEventDocAiSetMessages(result.result);
  }
}
