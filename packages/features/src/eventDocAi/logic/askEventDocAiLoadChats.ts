import { AskResponse } from '@qpqjs/core';

import { askUiCatch } from '../../ui/logic/askUiCatch';
import { askEventDocAiSetChats } from '../module/actionCreators/askEventDocAiSetChats';
import { askEventDocAiSetError } from '../module/actionCreators/askEventDocAiSetError';
import { askEventDocAiSetLoadingChats } from '../module/actionCreators/askEventDocAiSetLoadingChats';
import { askEventDocAiChatListRequest } from '../transport/askEventDocAiChatListRequest';

export function* askEventDocAiLoadChats(): AskResponse<void> {
  const result = yield* askUiCatch(askEventDocAiChatListRequest(), {
    askSetError: askEventDocAiSetError,
    askSetBusy: askEventDocAiSetLoadingChats,
  });

  if (result.success) {
    yield* askEventDocAiSetChats(result.result);
  }
}
