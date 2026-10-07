import { AiStreamUsage } from './types/AiStreamUsage';

const USAGE_FIELDS = ['inputTokens', 'outputTokens', 'totalTokens', 'cacheReadInputTokens', 'cacheWriteInputTokens', 'noCacheInputTokens'] as const;

/**
 * Adds token usages together field by field, for a chat's cost or a turn that spanned several
 * executions. A field no usage reported stays undefined rather than becoming zero.
 */
export const sumAiStreamUsage = (usages: readonly AiStreamUsage[]): AiStreamUsage =>
  USAGE_FIELDS.reduce<AiStreamUsage>((sum, field) => {
    const reported = usages.map((usage) => usage[field]).filter((value): value is number => value !== undefined);

    return reported.length > 0 ? { ...sum, [field]: reported.reduce((total, value) => total + value, 0) } : sum;
  }, {});
