import { askCatch, AskResponse } from '@qpqjs/core';

import { askUIEventDocAiSetChats } from '../module/actionCreators/askUIEventDocAiSetChats';
import { askUIEventDocAiSetError } from '../module/actionCreators/askUIEventDocAiSetError';
import { askUIEventDocAiSetLoadingChats } from '../module/actionCreators/askUIEventDocAiSetLoadingChats';
import { askEventDocAiChatListRequest } from '../transport/askEventDocAiChatListRequest';

export function* askEventDocAiLoadChats(): AskResponse<void> {
  yield* askUIEventDocAiSetLoadingChats(true);

  const result = yield* askCatch(askEventDocAiChatListRequest(), askUIEventDocAiSetLoadingChats(false));

  if (result.success) {
    yield* askUIEventDocAiSetChats(result.result);
  } else {
    yield* askUIEventDocAiSetError(result.error.errorText);
  }
}
