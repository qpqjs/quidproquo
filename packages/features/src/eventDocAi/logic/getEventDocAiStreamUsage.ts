import {
  type AiStreamFinish,
  type AiStreamFinishStep,
  type AiStreamPart,
  AiStreamPartType,
  type AiStreamUsage,
  Nullable,
  sumAiStreamUsage,
} from '@qpqjs/core';

/**
 * The usage the stream reported for the whole execution: its Finish part's, or, when it never
 * finished (it errored, or was stopped), the sum of the steps that did. Null when no step finished.
 */
export const getEventDocAiStreamUsage = (parts: AiStreamPart[]): Nullable<AiStreamUsage> => {
  const finishPart = parts.find((part): part is AiStreamFinish => part.type === AiStreamPartType.Finish);

  if (finishPart) {
    return finishPart.usage;
  }

  const stepUsages = parts.filter((part): part is AiStreamFinishStep => part.type === AiStreamPartType.FinishStep).map((part) => part.usage);

  return stepUsages.length > 0 ? sumAiStreamUsage(stepUsages) : null;
};
