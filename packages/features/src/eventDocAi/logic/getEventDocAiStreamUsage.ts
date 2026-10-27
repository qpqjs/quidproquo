import { type AiStreamFinish, type AiStreamPart, AiStreamPartType, type AiStreamUsage, Nullable } from 'quidproquo-core';

/** The usage the stream reported for the whole execution, from its Finish part; null if it never finished. */
export const getEventDocAiStreamUsage = (parts: AiStreamPart[]): Nullable<AiStreamUsage> => {
  const finishPart = parts.find((part): part is AiStreamFinish => part.type === AiStreamPartType.Finish);

  return finishPart?.usage ?? null;
};
