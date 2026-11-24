import { AskResponse } from '@qpqjs/core';

import { askEventDocAiProvide, askEventDocAiRead } from '../context';

/**
 * Runs a turn with its chat id added to the event doc AI context, so a tool that acts on the chat itself reads
 * the trusted id from context, never from what the model passes.
 */
export function* askEventDocAiProvideChat<T>(chatId: string, story: AskResponse<T>): AskResponse<T> {
  const context = yield* askEventDocAiRead();

  return yield* askEventDocAiProvide({ ...context, chatId }, story);
}
