import { type AiStreamPart, AskResponse, askStreamMap } from '@qpqjs/core';

import { askEventDocAiAppendStreamChunk } from '../module';
import type { EventDocAiStreamHandle } from './EventDocAiStreamHandle';
import { isEventDocAiStreamPartForwarded } from './isEventDocAiStreamPartForwarded';
import { redactAiStreamPartUsage } from './redactAiStreamPartUsage';

// Drains the model stream, forwarding each part to the UI as it arrives, and returns every
// part so the reply can be folded afterwards. Usage is never forwarded: the platform's cost is on
// it, and the UI reads usage off the finalized message, which carries the client's charge instead.
export function* askEventDocAiStreamToUi(chatId: string, streamHandle: EventDocAiStreamHandle): AskResponse<AiStreamPart[]> {
  return yield* askStreamMap(streamHandle, function* askForwardPart(part) {
    // Parts that are not forwarded are still collected so the saved message folds the same way.
    if (isEventDocAiStreamPartForwarded(part)) {
      yield* askEventDocAiAppendStreamChunk(redactAiStreamPartUsage(part), chatId);
    }

    return part;
  });
}
