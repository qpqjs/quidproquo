import { type AiStreamPart, AiStreamPartType, AskResponse, askStreamMap } from '@qpqjs/core';

import { askUIEventDocAiAppendStreamChunk } from '../module';
import type { EventDocAiStreamHandle } from './askEventDocAiPromptStreamOpen';
import { redactAiStreamPartUsage } from './redactAiStreamPartUsage';

// Drains the model stream, forwarding each part to the UI as it arrives, and returns every
// part so the reply can be folded afterwards.
export function* askEventDocAiStreamToUi(streamHandle: EventDocAiStreamHandle, usageVisible: boolean): AskResponse<AiStreamPart[]> {
  return yield* askStreamMap(streamHandle, function* askForwardPart(part) {
    // Tool argument fragments are not forwarded: a large tool input arrives as
    // hundreds of deltas, and the UI only needs to know a call has started
    // (ToolInputStart) and what it was (ToolCall). They are still collected so
    // the saved message folds the same way.
    if (part.type !== AiStreamPartType.ToolInputDelta) {
      yield* askUIEventDocAiAppendStreamChunk(usageVisible ? part : redactAiStreamPartUsage(part));
    }

    return part;
  });
}
