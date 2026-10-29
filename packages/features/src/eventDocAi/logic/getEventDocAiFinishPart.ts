import { type AiStreamFinish, type AiStreamPart, AiStreamPartType } from '@qpqjs/core';

// The Finish part's reason says how the underlying AI SDK loop ended: `stop`
// means the model finished its answer; `toolCalls` means a stop condition cut
// it off while it still wanted to keep acting; `length` means the output token
// cap cut it off. Both of the latter can be resumed from the saved history.
export const getEventDocAiFinishPart = (parts: AiStreamPart[]): AiStreamFinish | undefined =>
  parts.find((part): part is AiStreamFinish => part.type === AiStreamPartType.Finish);
