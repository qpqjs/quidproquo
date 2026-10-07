import { type AiStreamPart, AiStreamPartType } from 'quidproquo-core';

/** The part with its token usage emptied, for browsers that must not see usage. Other parts pass through. */
export const redactAiStreamPartUsage = (part: AiStreamPart): AiStreamPart =>
  part.type === AiStreamPartType.Finish || part.type === AiStreamPartType.FinishStep ? { ...part, usage: {} } : part;
