import { askCatch, AskResponse } from '@qpqjs/core';

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
  yield* askUIEventDocAiSetLoadingHistory(true);

  const result = yield* askCatch(askEventDocAiChatHistoryRequest({ chatId }), askUIEventDocAiSetLoadingHistory(false));

  if (result.success) {
    yield* askUIEventDocAiSetMessages(result.result);
  } else {
    yield* askUIEventDocAiSetError(result.error.errorText);
  }
}
