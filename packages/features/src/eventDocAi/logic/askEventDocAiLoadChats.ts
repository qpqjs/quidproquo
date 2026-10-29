import { AskResponse } from '@qpqjs/core';

import { askUiCatch } from '../../ui/logic/askUiCatch';
import { askUIEventDocAiSetChats } from '../module/actionCreators/askUIEventDocAiSetChats';
import { askUIEventDocAiSetError } from '../module/actionCreators/askUIEventDocAiSetError';
import { askUIEventDocAiSetLoadingChats } from '../module/actionCreators/askUIEventDocAiSetLoadingChats';
import { askEventDocAiChatListRequest } from '../transport/askEventDocAiChatListRequest';

export function* askEventDocAiLoadChats(): AskResponse<void> {
  const result = yield* askUiCatch(askEventDocAiChatListRequest(), {
    askSetError: askUIEventDocAiSetError,
    askSetBusy: askUIEventDocAiSetLoadingChats,
  });

  if (result.success) {
    yield* askUIEventDocAiSetChats(result.result);
  }
}
