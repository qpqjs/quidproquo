import { askCatch, AskResponse } from 'quidproquo-core';

import { askUIEventDocAiClearStream } from '../actionCreators/askUIEventDocAiClearStream';
import { askUIEventDocAiSetActiveChat } from '../actionCreators/askUIEventDocAiSetActiveChat';
import { askUIEventDocAiSetError } from '../actionCreators/askUIEventDocAiSetError';
import { askUIEventDocAiSetLoadingHistory } from '../actionCreators/askUIEventDocAiSetLoadingHistory';
import { askUIEventDocAiSetMessages } from '../actionCreators/askUIEventDocAiSetMessages';
import { askEventDocAiChatHistoryRequest } from '../requests/askEventDocAiChatHistoryRequest';

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
