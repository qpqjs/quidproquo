import type { Nullable } from '@qpqjs/core';
import { askCatch, AskResponse } from '@qpqjs/core';

import type { EventDocAiChatSummary } from '../models';
import { askUIEventDocAiClearStream } from '../module/actionCreators/askUIEventDocAiClearStream';
import { askUIEventDocAiSetActiveChat } from '../module/actionCreators/askUIEventDocAiSetActiveChat';
import { askUIEventDocAiSetError } from '../module/actionCreators/askUIEventDocAiSetError';
import { askUIEventDocAiSetMessages } from '../module/actionCreators/askUIEventDocAiSetMessages';
import { askUIEventDocAiUpsertChat } from '../module/actionCreators/askUIEventDocAiUpsertChat';
import { askEventDocAiChatCreateRequest } from '../transport/askEventDocAiChatCreateRequest';

export function* askEventDocAiNewChat(): AskResponse<Nullable<EventDocAiChatSummary>> {
  const result = yield* askCatch(askEventDocAiChatCreateRequest());

  if (!result.success) {
    yield* askUIEventDocAiSetError(result.error.errorText);
    return null;
  }

  yield* askUIEventDocAiUpsertChat(result.result);
  yield* askUIEventDocAiSetActiveChat(result.result.chatId);
  yield* askUIEventDocAiSetMessages([]);
  yield* askUIEventDocAiClearStream();

  return result.result;
}
