import type { Nullable } from '@qpqjs/core';
import { AskResponse } from '@qpqjs/core';

import { askUiCatch } from '../../ui/logic/askUiCatch';
import type { EventDocAiChatSummary } from '../models';
import { askEventDocAiClearStream } from '../module/actionCreators/askEventDocAiClearStream';
import { askEventDocAiSetActiveChat } from '../module/actionCreators/askEventDocAiSetActiveChat';
import { askEventDocAiSetError } from '../module/actionCreators/askEventDocAiSetError';
import { askEventDocAiSetMessages } from '../module/actionCreators/askEventDocAiSetMessages';
import { askEventDocAiUpsertChat } from '../module/actionCreators/askEventDocAiUpsertChat';
import { askEventDocAiChatCreateRequest } from '../transport/askEventDocAiChatCreateRequest';

export function* askEventDocAiNewChat(): AskResponse<Nullable<EventDocAiChatSummary>> {
  const result = yield* askUiCatch(askEventDocAiChatCreateRequest(), { askSetError: askEventDocAiSetError });

  if (!result.success) {
    return null;
  }

  yield* askEventDocAiUpsertChat(result.result);
  yield* askEventDocAiSetActiveChat(result.result.chatId);
  yield* askEventDocAiSetMessages([]);
  yield* askEventDocAiClearStream();

  return result.result;
}
