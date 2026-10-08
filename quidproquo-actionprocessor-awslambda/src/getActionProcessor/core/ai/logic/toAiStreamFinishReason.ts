import { AiStreamFinishReasonEnum } from 'quidproquo-core';

const knownFinishReasons = new Set<string>(Object.values(AiStreamFinishReasonEnum));

// Anthropic's own stop reason when its safety classifiers decline a request. The AI SDK only
// knows Bedrock's stop reasons, so a `refusal` that reaches it unmapped comes out as `other`.
const refusalRawReasons = new Set<string>(['refusal']);

/**
 * The AI SDK's FinishReason strings map 1:1 onto the enum; anything a future SDK version adds
 * degrades to `unknown` instead of leaking an untyped string into core's typed parts. The raw
 * provider reason, when known, can override that: a refusal is reported as a content filter.
 */
export const toAiStreamFinishReason = (finishReason: string, rawFinishReason?: string): AiStreamFinishReasonEnum => {
  if (rawFinishReason && refusalRawReasons.has(rawFinishReason)) {
    return AiStreamFinishReasonEnum.contentFilter;
  }

  return knownFinishReasons.has(finishReason) ? (finishReason as AiStreamFinishReasonEnum) : AiStreamFinishReasonEnum.unknown;
};
