import { askCatch, AskResponse } from 'quidproquo-core';

import { askUIEventDocAiSetChats } from '../actionCreators/askUIEventDocAiSetChats';
import { askUIEventDocAiSetError } from '../actionCreators/askUIEventDocAiSetError';
import { askUIEventDocAiSetLoadingChats } from '../actionCreators/askUIEventDocAiSetLoadingChats';
import { askEventDocAiChatListRequest } from '../requests/askEventDocAiChatListRequest';

export function* askEventDocAiLoadChats(): AskResponse<void> {
  yield* askUIEventDocAiSetLoadingChats(true);

  const result = yield* askCatch(askEventDocAiChatListRequest(), askUIEventDocAiSetLoadingChats(false));

  if (result.success) {
    yield* askUIEventDocAiSetChats(result.result);
  } else {
    yield* askUIEventDocAiSetError(result.error.errorText);
  }
}
