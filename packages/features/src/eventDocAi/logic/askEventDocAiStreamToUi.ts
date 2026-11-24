import { type AiStreamPart, AskResponse, askStreamMap } from '@qpqjs/core';

import { askEventDocAiChatGet } from '../data/askEventDocAiChatGet';
import { askEventDocAiAppendStreamChunk, askEventDocAiUpsertChat } from '../module';
import type { EventDocAiStreamHandle } from './EventDocAiStreamHandle';
import { isEventDocAiChatRenamedPart } from './isEventDocAiChatRenamedPart';
import { isEventDocAiStreamPartForwarded } from './isEventDocAiStreamPartForwarded';
import { redactAiStreamPartUsage } from './redactAiStreamPartUsage';

// Drains the model stream, forwarding each part to the UI as it arrives, and returns every
// part so the reply can be folded afterwards. Usage is never forwarded: the platform's cost is on
// it, and the UI reads usage off the finalized message, which carries the client's charge instead.
export function* askEventDocAiStreamToUi(docId: string, chatId: string, streamHandle: EventDocAiStreamHandle): AskResponse<AiStreamPart[]> {
  return yield* askStreamMap(streamHandle, function* askForwardPart(part) {
    // Parts that are not forwarded are still collected so the saved message folds the same way.
    if (isEventDocAiStreamPartForwarded(part)) {
      yield* askEventDocAiAppendStreamChunk(redactAiStreamPartUsage(part), chatId);
    }

    // The model renamed the chat: the chat is read back and sent on, so the person's list of chats shows
    // the new name at once. The tool itself answers the model with nothing but that it worked.
    if (isEventDocAiChatRenamedPart(part)) {
      const chat = yield* askEventDocAiChatGet(docId, chatId);

      if (chat) {
        yield* askEventDocAiUpsertChat(chat);
      }
    }

    return part;
  });
}
