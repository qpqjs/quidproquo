import { AiStreamFinishStep, AiStreamPartType } from 'quidproquo-core';

import { AiSdkStreamPartOfType } from '../types';
import { toAiStreamFinishReason } from './toAiStreamFinishReason';
import { toAiStreamUsage } from './toAiStreamUsage';

export const mapAiStreamFinishStep = (part: AiSdkStreamPartOfType<'finish-step'>): AiStreamFinishStep => ({
  type: AiStreamPartType.FinishStep,
  finishReason: toAiStreamFinishReason(part.finishReason, part.rawFinishReason),
  ...(part.rawFinishReason ? { rawFinishReason: part.rawFinishReason } : {}),
  usage: toAiStreamUsage(part.usage),
});
