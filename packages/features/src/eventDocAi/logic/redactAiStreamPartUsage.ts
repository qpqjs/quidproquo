import { type AiStreamPart, AiStreamPartType } from '@qpqjs/core';

/** The part with its usage emptied, as the live stream is sent to the browser; usage reaches it only on the finalized message. Other parts pass through. */
export const redactAiStreamPartUsage = (part: AiStreamPart): AiStreamPart =>
  part.type === AiStreamPartType.Finish || part.type === AiStreamPartType.FinishStep ? { ...part, usage: {} } : part;
