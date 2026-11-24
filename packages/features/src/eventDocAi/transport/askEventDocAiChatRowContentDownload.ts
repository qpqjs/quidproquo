import { askNetworkRequest, askRedactString, AskResponse, askThrowError, ErrorTypeEnum } from '@qpqjs/core';

import type { EventDocAiChatRowContentFile } from '../types/EventDocAiChatRowContentFile';

/** Downloads one chat row's stored content from the short-lived link the server answered a content request with. */
export function* askEventDocAiChatRowContentDownload(url: string): AskResponse<unknown> {
  // The link reads the content for anyone who holds it, so it is kept out of the log.
  yield* askRedactString(url);

  const response = yield* askNetworkRequest<EventDocAiChatRowContentFile>('GET', url);

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `The chat row content could not be downloaded (${response.status})`);
  }

  return response.data.content;
}
