import type { Nullable } from 'quidproquo-core';
import { askCatch, AskResponse } from 'quidproquo-core';

import type { EventDocAiChatSummary } from '../../models';
import { askUIEventDocAiClearStream } from '../actionCreators/askUIEventDocAiClearStream';
import { askUIEventDocAiSetActiveChat } from '../actionCreators/askUIEventDocAiSetActiveChat';
import { askUIEventDocAiSetError } from '../actionCreators/askUIEventDocAiSetError';
import { askUIEventDocAiSetMessages } from '../actionCreators/askUIEventDocAiSetMessages';
import { askUIEventDocAiUpsertChat } from '../actionCreators/askUIEventDocAiUpsertChat';
import { askEventDocAiChatCreateRequest } from '../requests/askEventDocAiChatCreateRequest';

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
