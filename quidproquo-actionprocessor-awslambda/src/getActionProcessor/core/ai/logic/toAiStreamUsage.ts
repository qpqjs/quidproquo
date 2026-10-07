import { AiStreamUsage } from 'quidproquo-core';

type SdkUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  inputTokenDetails?: {
    noCacheTokens?: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  };
};

export const toAiStreamUsage = (usage: SdkUsage): AiStreamUsage => ({
  inputTokens: usage.inputTokens,
  outputTokens: usage.outputTokens,
  totalTokens: usage.totalTokens,
  cacheReadInputTokens: usage.inputTokenDetails?.cacheReadTokens,
  cacheWriteInputTokens: usage.inputTokenDetails?.cacheWriteTokens,
  noCacheInputTokens: usage.inputTokenDetails?.noCacheTokens,
});
