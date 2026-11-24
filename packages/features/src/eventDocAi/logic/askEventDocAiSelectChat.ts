import { AskResponse } from '@qpqjs/core';

import { askUiCatch } from '../../ui/logic/askUiCatch';
import { EventDocAiLoadChatRowsMode } from '../models/EventDocAiLoadChatRowsMode';
import { askEventDocAiClearStream } from '../module/actionCreators/askEventDocAiClearStream';
import { askEventDocAiSetActiveChat } from '../module/actionCreators/askEventDocAiSetActiveChat';
import { askEventDocAiSetError } from '../module/actionCreators/askEventDocAiSetError';
import { askEventDocAiSetLoadingHistory } from '../module/actionCreators/askEventDocAiSetLoadingHistory';
import { askEventDocAiSetMessages } from '../module/actionCreators/askEventDocAiSetMessages';
import { askEventDocAiChatRowContentsFill } from './askEventDocAiChatRowContentsFill';
import { askEventDocAiLoadChatRows } from './askEventDocAiLoadChatRows';

export function* askEventDocAiSelectChat(chatId: string): AskResponse<void> {
  yield* askEventDocAiSetActiveChat(chatId);
  yield* askEventDocAiSetMessages([]);
  yield* askEventDocAiClearStream();

  // The newest page shows first and the older ones fill in above it.
  const result = yield* askUiCatch(askEventDocAiLoadChatRows(chatId, EventDocAiLoadChatRowsMode.ShowEachPage), {
    askSetError: askEventDocAiSetError,
    askSetBusy: askEventDocAiSetLoadingHistory,
  });

  if (result.success && result.result) {
    yield* askEventDocAiChatRowContentsFill(chatId, result.result);
  }
}
